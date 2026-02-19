"""
Order Processing Tasks
주문 처리 Celery 태스크
"""
from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging
import uuid

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import (
    Order, OrderItem, ExternalOrder, Shipment, ShipmentEvent,
    Supplier, Product, OrderStatus, ExternalOrderStatus, ShipmentStatus, PaymentStatus
)
from app.connectors import get_connector

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.order_process.process_order")
def process_order(self, order_id: int) -> dict:
    """
    주문 처리 (결제 완료 후)
    - 공급자별로 ExternalOrder 생성
    - 각 공급자에 주문 발주
    
    Args:
        order_id: 주문 ID
    """
    db = SessionLocal()
    result = {
        "order_id": order_id,
        "external_orders": [],
        "success": False
    }
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError(f"Order {order_id} not found")
        
        # 이미 처리된 주문인지 확인
        if order.status != OrderStatus.PAID:
            logger.info(f"Order {order_id} is not in PAID status, skipping")
            return result
        
        # 주문 상태를 PROCESSING으로 변경
        order.status = OrderStatus.PROCESSING
        db.commit()
        
        # 상품별로 공급자 그룹화
        supplier_items = {}
        for item in order.items:
            if item.product:
                supplier_id = item.product.supplier_id
                if supplier_id not in supplier_items:
                    supplier_items[supplier_id] = []
                supplier_items[supplier_id].append(item)
        
        # 공급자별 발주 생성
        for supplier_id, items in supplier_items.items():
            supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
            if not supplier:
                continue
            
            # ExternalOrder 생성 (001: order_item_id 필수, 002: order_id 추가)
            first_item = items[0]
            external_order = ExternalOrder(
                order_item_id=first_item.id,
                order_id=order_id,
                supplier_id=supplier_id,
                status=ExternalOrderStatus.PENDING,
            )
            db.add(external_order)
            db.flush()
            
            # 공급자에 주문 발주 시도
            try:
                connector = get_connector(supplier.supplier_type.value)
                if connector:
                    # 발주 데이터 구성
                    order_data = {
                        "items": [
                            {
                                "external_id": item.product.external_id,
                                "quantity": item.quantity,
                                "variant_id": item.variant.external_variant_id if item.variant else None
                            }
                            for item in items
                        ],
                        "shipping": {
                            "name": order.shipping_name,
                            "phone": order.shipping_phone,
                            "zip_code": order.shipping_zip_code,
                            "address1": order.shipping_address1,
                            "address2": order.shipping_address2 or ""
                        }
                    }
                    
                    # 발주 실행
                    response = connector.place_order(
                        api_key=supplier.api_key,
                        api_secret=supplier.api_secret,
                        order_data=order_data
                    )
                    
                    external_order.external_order_id = response.get("order_id")
                    external_order.status = ExternalOrderStatus.ORDERED
                    external_order.raw_response = response
                    
                    result["external_orders"].append({
                        "supplier_id": supplier_id,
                        "external_order_id": external_order.external_order_id,
                        "status": "success"
                    })
                else:
                    raise ValueError(f"No connector for {supplier.supplier_type}")
                    
            except Exception as e:
                logger.error(f"Failed to place order with supplier {supplier_id}: {e}")
                external_order.status = ExternalOrderStatus.FAILED
                external_order.error_message = str(e)
                external_order.attempts += 1
                
                result["external_orders"].append({
                    "supplier_id": supplier_id,
                    "status": "failed",
                    "error": str(e)
                })
        
        db.commit()
        
        # 모든 발주 성공 여부 확인
        all_success = all(
            eo["status"] == "success" for eo in result["external_orders"]
        )
        result["success"] = all_success
        
        return result
        
    except Exception as e:
        logger.error(f"Order processing failed for {order_id}: {e}")
        db.rollback()
        raise self.retry(exc=e)
    finally:
        db.close()


@celery_app.task(bind=True, name="app.tasks.order_process.retry_failed_orders")
def retry_failed_orders(self) -> dict:
    """실패한 외부 주문 재시도"""
    db = SessionLocal()
    results = []
    
    try:
        failed_orders = db.query(ExternalOrder).filter(
            ExternalOrder.status == ExternalOrderStatus.FAILED,
            ExternalOrder.attempts < 5  # 최대 5회 재시도
        ).all()
        
        for ext_order in failed_orders:
            # 각 실패 주문에 대해 재시도 태스크 생성
            task = process_single_external_order.delay(ext_order.id)
            results.append({
                "external_order_id": ext_order.id,
                "task_id": task.id
            })
        
        return {
            "retried_count": len(results),
            "tasks": results
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="app.tasks.order_process.process_single_external_order")
def process_single_external_order(self, external_order_id: int) -> dict:
    """단일 외부 주문 처리/재시도"""
    db = SessionLocal()
    
    try:
        ext_order = db.query(ExternalOrder).filter(
            ExternalOrder.id == external_order_id
        ).first()
        
        if not ext_order:
            return {"error": "External order not found"}
        
        supplier = ext_order.supplier
        if not supplier:
            return {"error": "Supplier not found"}
        
        connector = get_connector(supplier.supplier_type.value)
        if not connector:
            return {"error": "Connector not found"}
        
        # 주문의 아이템들 가져오기
        order = ext_order.order
        items = [
            item for item in order.items
            if item.product and item.product.supplier_id == supplier.id
        ]
        
        order_data = {
            "items": [
                {
                    "external_id": item.product.external_id,
                    "quantity": item.quantity,
                    "variant_id": item.variant.external_variant_id if item.variant else None
                }
                for item in items
            ],
            "shipping": {
                "name": order.shipping_name,
                "phone": order.shipping_phone,
                "zip_code": order.shipping_zip_code,
                "address1": order.shipping_address1,
                "address2": order.shipping_address2 or ""
            }
        }
        
        response = connector.place_order(
            api_key=supplier.api_key,
            api_secret=supplier.api_secret,
            order_data=order_data
        )
        
        ext_order.external_order_id = response.get("order_id")
        ext_order.status = ExternalOrderStatus.ORDERED
        ext_order.raw_response = response
        
        db.commit()
        
        return {
            "external_order_id": external_order_id,
            "status": "success",
            "external_id": ext_order.external_order_id
        }
        
    except Exception as e:
        logger.error(f"Failed to process external order {external_order_id}: {e}")
        if 'ext_order' in locals():
            ext_order.attempts += 1
            ext_order.error_message = str(e)
            db.commit()
        raise self.retry(exc=e)
    finally:
        db.close()


@celery_app.task(name="app.tasks.order_process.update_all_order_statuses")
def update_all_order_statuses() -> dict:
    """모든 활성 주문의 상태 업데이트"""
    db = SessionLocal()
    updated = 0
    
    try:
        # PROCESSING 또는 SHIPPED 상태의 외부 주문 조회
        active_external_orders = db.query(ExternalOrder).filter(
            ExternalOrder.status.in_([
                ExternalOrderStatus.ORDERED,
                ExternalOrderStatus.SHIPPED
            ])
        ).all()
        
        for ext_order in active_external_orders:
            if not ext_order.external_order_id or not ext_order.supplier:
                continue
            
            connector = get_connector(ext_order.supplier.supplier_type.value)
            if not connector:
                continue
            
            try:
                status_data = connector.get_order_status(
                    api_key=ext_order.supplier.api_key,
                    api_secret=ext_order.supplier.api_secret,
                    order_id=ext_order.external_order_id
                )
                
                new_status = status_data.get("status")
                if new_status == "shipped":
                    ext_order.status = ExternalOrderStatus.SHIPPED
                    
                    # Shipment 생성 (없으면)
                    if not ext_order.shipments:
                        shipment_order_id = ext_order.order_id or (
                            ext_order.order_item.order_id if ext_order.order_item else None
                        )
                        if not shipment_order_id:
                            logger.warning(
                                f"Skipping shipment create for external order {ext_order.id}: missing order_id"
                            )
                            continue
                        shipment = Shipment(
                            order_id=shipment_order_id,
                            external_order_id=ext_order.id,
                            tracking_number=status_data.get("tracking_number"),
                            courier=status_data.get("courier"),
                            status=ShipmentStatus.IN_TRANSIT,
                            shipped_at=datetime.utcnow()
                        )
                        db.add(shipment)
                        
                elif new_status == "delivered":
                    ext_order.status = ExternalOrderStatus.DELIVERED
                
                updated += 1
                
            except Exception as e:
                logger.error(f"Failed to update status for external order {ext_order.id}: {e}")
        
        db.commit()
        
        # 모든 외부 주문이 배송 완료된 주문의 상태 업데이트
        orders_to_complete = db.query(Order).filter(
            Order.status == OrderStatus.SHIPPED
        ).all()
        
        for order in orders_to_complete:
            all_delivered = all(
                ext.status == ExternalOrderStatus.DELIVERED
                for ext in order.external_orders
            )
            if all_delivered and order.external_orders:
                order.status = OrderStatus.DELIVERED
        
        db.commit()
        
        return {"updated_count": updated}
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.order_process.update_shipment_tracking")
def update_shipment_tracking() -> dict:
    """배송 추적 정보 업데이트"""
    db = SessionLocal()
    updated = 0
    
    try:
        # 활성 배송 조회
        active_shipments = db.query(Shipment).filter(
            Shipment.status.in_([
                ShipmentStatus.PICKED_UP,
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.OUT_FOR_DELIVERY
            ]),
            Shipment.tracking_number.isnot(None)
        ).all()
        
        for shipment in active_shipments:
            ext_order = shipment.external_order
            if not ext_order or not ext_order.supplier:
                continue
            
            connector = get_connector(ext_order.supplier.supplier_type.value)
            if not connector:
                continue
            
            try:
                tracking_data = connector.get_tracking_info(
                    tracking_number=shipment.tracking_number,
                    courier=shipment.courier
                )
                
                # 이벤트 추가
                events = tracking_data.get("events", [])
                for event_data in events:
                    # 중복 체크
                    existing = db.query(ShipmentEvent).filter(
                        ShipmentEvent.shipment_id == shipment.id,
                        ShipmentEvent.event_time == event_data.get("time")
                    ).first()
                    
                    if not existing:
                        event = ShipmentEvent(
                            shipment_id=shipment.id,
                            status=event_data.get("status"),
                            description=event_data.get("description"),
                            location=event_data.get("location"),
                            event_time=event_data.get("time")
                        )
                        db.add(event)
                
                # 상태 업데이트
                current_status = tracking_data.get("current_status")
                if current_status == "delivered":
                    shipment.status = ShipmentStatus.DELIVERED
                    shipment.delivered_at = datetime.utcnow()
                elif current_status == "out_for_delivery":
                    shipment.status = ShipmentStatus.OUT_FOR_DELIVERY
                updated += 1
                
            except Exception as e:
                logger.error(f"Failed to update tracking for shipment {shipment.id}: {e}")
        
        db.commit()
        
        return {"updated_count": updated}
        
    finally:
        db.close()
