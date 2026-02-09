from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Product, ProductVariant
from app.schemas.product import ProductOut, ProductListOut, ProductCreate

router = APIRouter()


@router.get("/categories/list")
async def get_categories(db: Session = Depends(get_db)):
    """카테고리 목록 (경로 충돌 방지로 상단 정의)"""
    categories = db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()
    return [c[0] for c in categories if c[0]]


@router.get("/external/{external_id}", response_model=ProductOut)
async def get_product_by_external_id(external_id: str, db: Session = Depends(get_db)):
    """외부 ID로 상품 조회"""
    product = db.query(Product).filter(Product.external_id == external_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/", response_model=ProductListOut)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """상품 목록 조회"""
    query = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(
            (Product.name_ko.ilike(f"%{search}%")) | (Product.name.ilike(f"%{search}%"))
        )
    if min_price is not None:
        query = query.filter(Product.selling_price >= min_price)
    if max_price is not None:
        query = query.filter(Product.selling_price <= max_price)
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    return {"items": products, "total": total, "skip": skip, "limit": limit}


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """상품 상세 조회"""
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
