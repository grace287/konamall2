"""
Product Sync Tasks
상품 동기화 Celery 태스크
"""
from celery import shared_task
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Supplier, Product, ProductImage, ProductVariant, SupplierType
from app.connectors import get_connector

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.product_sync.sync_supplier_products")
def sync_supplier_products(self, supplier_id: int) -> dict:
    """
    특정 공급자의 상품 동기화
    
    Args:
        supplier_id: 공급자 ID
    
    Returns:
        동기화 결과 (신규, 업데이트, 실패 수)
    """
    db = SessionLocal()
    result = {
        "supplier_id": supplier_id,
        "created": 0,
        "updated": 0,
        "failed": 0,
        "errors": []
    }
    
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")
        
        if not supplier.is_active:
            logger.info(f"Supplier {supplier.name} is inactive, skipping")
            return result
        
        # 커넥터 가져오기
        connector = get_connector(supplier.supplier_type.value)
        if not connector:
            raise ValueError(f"No connector for {supplier.supplier_type}")
        
        # 상품 목록 가져오기
        logger.info(f"Fetching products from {supplier.name}...")
        products_data = connector.fetch_products(
            api_key=supplier.api_key,
            api_secret=supplier.api_secret,
            config=supplier.config or {}
        )
        
        for product_data in products_data:
            try:
                external_id = product_data.get("external_id") or product_data.get("id")
                if not external_id:
                    continue
                
                external_id = str(external_id)
                
                # 기존 상품 찾기
                existing = db.query(Product).filter(
                    Product.supplier_id == supplier_id,
                    Product.external_id == external_id
                ).first()
                
                # 가격 계산 (마진 적용)
                price_usd = float(product_data.get("price", 0))
                exchange_rate = supplier.config.get("exchange_rate", 1350)
                margin_percent = supplier.config.get("margin_percent", 30)
                price_krw = int(price_usd * exchange_rate * (1 + margin_percent / 100))
                
                if existing:
                    # 업데이트
                    existing.title = product_data.get("title", existing.title)
                    existing.title_ko = product_data.get("title_ko", existing.title_ko)
                    existing.description = product_data.get("description", existing.description)
                    existing.description_ko = product_data.get("description_ko", existing.description_ko)
                    existing.price_original = price_usd
                    existing.price_final = price_krw
                    existing.stock = product_data.get("stock", 0)
                    existing.last_synced_at = datetime.utcnow()
                    result["updated"] += 1
                else:
                    # 신규 생성
                    new_product = Product(
                        supplier_id=supplier_id,
                        external_id=external_id,
                        title=product_data.get("title", "Unknown"),
                        title_ko=product_data.get("title_ko"),
                        description=product_data.get("description"),
                        description_ko=product_data.get("description_ko"),
                        price_original=price_usd,
                        price_final=price_krw,
                        currency="USD",
                        stock=product_data.get("stock", 0),
                        category=product_data.get("category"),
                        origin_url=product_data.get("url"),
                        last_synced_at=datetime.utcnow()
                    )
                    db.add(new_product)
                    db.flush()  # ID 생성
                    
                    # 이미지 추가
                    images = product_data.get("images", [])
                    for i, img_url in enumerate(images):
                        img = ProductImage(
                            product_id=new_product.id,
                            url=img_url,
                            is_main=(i == 0),
                            sort_order=i
                        )
                        db.add(img)
                    
                    # 옵션 추가
                    variants = product_data.get("variants", [])
                    for var_data in variants:
                        variant = ProductVariant(
                            product_id=new_product.id,
                            external_variant_id=str(var_data.get("id", "")),
                            name=var_data.get("name"),
                            sku=var_data.get("sku"),
                            price_usd=var_data.get("price"),
                            price_krw=int(var_data.get("price", 0) * exchange_rate * (1 + margin_percent / 100)),
                            stock=var_data.get("stock", 0)
                        )
                        db.add(variant)
                    
                    result["created"] += 1
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Error processing product {product_data}: {e}")
                result["failed"] += 1
                result["errors"].append(str(e))
                db.rollback()
        
        logger.info(f"Sync completed for {supplier.name}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Sync failed for supplier {supplier_id}: {e}")
        raise self.retry(exc=e)
    finally:
        db.close()


@celery_app.task(name="app.tasks.product_sync.sync_all_suppliers")
def sync_all_suppliers() -> dict:
    """모든 활성 공급자의 상품 동기화"""
    db = SessionLocal()
    results = []
    
    try:
        suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
        
        for supplier in suppliers:
            # 각 공급자별로 별도 태스크 실행
            task = sync_supplier_products.delay(supplier.id)
            results.append({
                "supplier_id": supplier.id,
                "supplier_name": supplier.name,
                "task_id": task.id
            })
        
        return {
            "total_suppliers": len(suppliers),
            "tasks": results
        }
    finally:
        db.close()


@celery_app.task(name="app.tasks.product_sync.translate_product")
def translate_product(product_id: int) -> dict:
    """상품 번역 (한글)"""
    db = SessionLocal()
    
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {"error": "Product not found"}
        
        # TODO: 실제 번역 API 연동 (Google Translate, DeepL 등)
        # 현재는 placeholder
        if not product.title_ko and product.title:
            # 임시: 영문 제목 그대로 사용
            product.title_ko = product.title
        
        if not product.description_ko and product.description:
            product.description_ko = product.description
        
        db.commit()
        
        return {
            "product_id": product_id,
            "translated": True
        }
    finally:
        db.close()
