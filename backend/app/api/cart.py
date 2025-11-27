"""
Cart API Router
장바구니 관리 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.db.models import Cart, CartItem, Product, ProductVariant, User
from app.schemas.order import CartItemAdd, CartItemUpdate, CartResponse, CartItemResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

# Constants
FREE_SHIPPING_THRESHOLD = 50000  # KRW
DEFAULT_SHIPPING_FEE = 3000  # KRW


def get_or_create_cart(db: Session, user: User) -> Cart:
    """사용자의 장바구니를 가져오거나 없으면 생성"""
    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def calculate_cart_totals(cart: Cart) -> dict:
    """장바구니 합계 계산"""
    subtotal = 0
    items_response = []
    
    for item in cart.items:
        product = item.product
        variant = item.variant
        
        # 가격 결정 (variant가 있으면 variant 가격, 없으면 product 가격)
        price = variant.price_krw if variant and variant.price_krw else product.price_final
        line_total = price * item.quantity
        subtotal += line_total
        
        # 메인 이미지 찾기
        main_image = None
        if product.images:
            main_img = next((img for img in product.images if img.is_main), None)
            main_image = main_img.url if main_img else (product.images[0].url if product.images else None)
        
        items_response.append(CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            product_title=product.title_ko or product.title,
            product_image=main_image,
            price_krw=price,
            line_total=line_total
        ))
    
    # 배송비 계산
    shipping_fee = 0 if subtotal >= FREE_SHIPPING_THRESHOLD else DEFAULT_SHIPPING_FEE
    total = subtotal + shipping_fee
    
    return {
        "id": cart.id,
        "items": items_response,
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "total": total
    }


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니 조회"""
    cart = get_or_create_cart(db, current_user)
    return calculate_cart_totals(cart)


@router.post("/items", response_model=CartResponse)
async def add_cart_item(
    item: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니에 상품 추가"""
    # 상품 존재 확인
    product = db.query(Product).filter(
        Product.id == item.product_id,
        Product.is_active == True
    ).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="상품을 찾을 수 없습니다"
        )
    
    # variant 확인 (있는 경우)
    if item.variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == item.variant_id,
            ProductVariant.product_id == item.product_id
        ).first()
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="상품 옵션을 찾을 수 없습니다"
            )
        # 재고 확인
        if variant.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다 (남은 수량: {variant.stock})"
            )
    else:
        # 상품 자체 재고 확인
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다 (남은 수량: {product.stock})"
            )
    
    cart = get_or_create_cart(db, current_user)
    
    # 이미 같은 상품(+옵션)이 있는지 확인
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item.product_id,
        CartItem.variant_id == item.variant_id
    ).first()
    
    if existing_item:
        # 수량 추가
        existing_item.quantity += item.quantity
    else:
        # 새 아이템 추가
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity
        )
        db.add(cart_item)
    
    db.commit()
    db.refresh(cart)
    
    return calculate_cart_totals(cart)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니 아이템 수량 변경"""
    cart = get_or_create_cart(db, current_user)
    
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="장바구니 아이템을 찾을 수 없습니다"
        )
    
    # 재고 확인
    if cart_item.variant_id:
        variant = db.query(ProductVariant).filter(
            ProductVariant.id == cart_item.variant_id
        ).first()
        if variant and variant.stock < update.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다 (남은 수량: {variant.stock})"
            )
    else:
        product = cart_item.product
        if product.stock < update.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"재고가 부족합니다 (남은 수량: {product.stock})"
            )
    
    cart_item.quantity = update.quantity
    db.commit()
    db.refresh(cart)
    
    return calculate_cart_totals(cart)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니에서 상품 제거"""
    cart = get_or_create_cart(db, current_user)
    
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="장바구니 아이템을 찾을 수 없습니다"
        )
    
    db.delete(cart_item)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """장바구니 비우기"""
    cart = get_or_create_cart(db, current_user)
    
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
