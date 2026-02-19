from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import Supplier
from app.schemas.supplier import SupplierType
from app.tasks.product_sync import sync_supplier_products

router = APIRouter()


@router.get("/")
async def get_suppliers(db: Session = Depends(get_db)):
    """공급처 목록"""
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    return suppliers


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """공급처 상세"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/{supplier_id}/sync")
async def sync_products(
    supplier_id: int,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """공급처 상품 동기화"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Celery 태스크 큐잉
    task = sync_supplier_products.delay(supplier_id=supplier_id, limit=limit)

    return {
        "message": f"Sync started for {supplier.name}",
        "supplier_id": supplier.id,
        "limit": limit,
        "task_id": task.id,
        "status": "queued",
    }


@router.post("/")
async def create_supplier(
    name: str,
    supplier_type: SupplierType,
    code: str = None,
    api_key: str = None,
    api_secret: str = None,
    db: Session = Depends(get_db)
):
    """공급처 등록 (connector_type = supplier_type.value, code는 유일해야 함)"""
    connector_value = supplier_type.value if hasattr(supplier_type, "value") else str(supplier_type)
    code = (code or f"{connector_value}_{name[:20]}").strip().lower().replace(" ", "_")
    existing = db.query(Supplier).filter(Supplier.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 같은 code를 가진 공급처가 있습니다.")
    supplier = Supplier(
        name=name,
        code=code,
        connector_type=connector_value,
        api_key=api_key,
        api_secret=api_secret,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier
