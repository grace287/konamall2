from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import Supplier, SupplierType
from app.connectors import get_connector

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
    background_tasks: BackgroundTasks,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """공급처 상품 동기화"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Background task로 동기화 실행
    # background_tasks.add_task(sync_supplier_products, supplier_id, limit)
    
    return {"message": f"Sync started for {supplier.name}", "limit": limit}


@router.post("/")
async def create_supplier(
    name: str,
    supplier_type: SupplierType,
    base_url: str = None,
    api_key: str = None,
    db: Session = Depends(get_db)
):
    """공급처 등록"""
    supplier = Supplier(
        name=name,
        supplier_type=supplier_type,
        base_url=base_url,
        api_key=api_key
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier
