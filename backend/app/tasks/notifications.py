"""
Notification Tasks
알림 Celery 태스크
"""
from celery import shared_task
from typing import Optional, List
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import User, Order, OrderStatus
from app.core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notifications.send_email")
def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> dict:
    """
    이메일 발송
    
    Args:
        to_email: 수신자 이메일
        subject: 제목
        html_content: HTML 본문
        text_content: 텍스트 본문 (선택)
    """
    try:
        # 실제 운영에서는 settings에서 SMTP 설정 가져옴
        smtp_host = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
        smtp_port = getattr(settings, 'SMTP_PORT', 587)
        smtp_user = getattr(settings, 'SMTP_USER', '')
        smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        from_email = getattr(settings, 'FROM_EMAIL', 'noreply@konamall.com')
        
        if not smtp_user:
            logger.warning("SMTP not configured, skipping email send")
            return {"success": False, "error": "SMTP not configured"}
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        if text_content:
            msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        
        logger.info(f"Email sent to {to_email}: {subject}")
        return {"success": True, "to": to_email}
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return {"success": False, "error": str(e)}


@celery_app.task(name="app.tasks.notifications.send_order_confirmation")
def send_order_confirmation(order_id: int) -> dict:
    """주문 확인 이메일 발송"""
    db = SessionLocal()
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or not order.user:
            return {"success": False, "error": "Order or user not found"}
        
        user = order.user
        
        # 주문 상품 목록 HTML
        items_html = ""
        for item in order.items:
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    {item.product_name}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    {item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    {item.unit_price:,.0f}원
                </td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Pretendard', -apple-system, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .footer {{ background: #f8f8f8; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .total {{ font-size: 20px; font-weight: bold; color: #ff6b35; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛒 주문이 완료되었습니다!</h1>
                </div>
                <div class="content">
                    <p>안녕하세요, <strong>{user.name or user.email}</strong>님!</p>
                    <p>주문이 성공적으로 접수되었습니다.</p>
                    
                    <h3>📦 주문 정보</h3>
                    <p><strong>주문번호:</strong> {order.order_number}</p>
                    <p><strong>주문일시:</strong> {order.created_at.strftime('%Y년 %m월 %d일 %H:%M')}</p>
                    
                    <h3>🛍️ 주문 상품</h3>
                    <table class="order-table">
                        <tr style="background: #f8f8f8;">
                            <th style="padding: 10px; text-align: left;">상품명</th>
                            <th style="padding: 10px; text-align: center;">수량</th>
                            <th style="padding: 10px; text-align: right;">가격</th>
                        </tr>
                        {items_html}
                    </table>
                    
                    <p class="total" style="text-align: right;">
                        총 결제금액: {order.total_amount:,.0f}원
                    </p>
                    
                    <h3>📍 배송지 정보</h3>
                    <p>{order.recipient_name} ({order.recipient_phone})</p>
                    <p>{order.recipient_address}</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="text-align: center;">
                        <a href="https://konamall.com/orders/{order.order_number}" 
                           style="background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                            주문 상세 보기
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p>KonaMall | 글로벌 직구의 새로운 기준</p>
                    <p>이 메일은 발신 전용입니다.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email.delay(
            to_email=user.email,
            subject=f"[KonaMall] 주문이 완료되었습니다 (#{order.order_number})",
            html_content=html_content
        ).get()
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.notifications.send_shipping_notification")
def send_shipping_notification(order_id: int, tracking_number: str, courier: str) -> dict:
    """배송 시작 알림 이메일 발송"""
    db = SessionLocal()
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or not order.user:
            return {"success": False, "error": "Order or user not found"}
        
        user = order.user
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Pretendard', -apple-system, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .tracking-box {{ background: #f0fdf4; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
                .tracking-number {{ font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚚 상품이 발송되었습니다!</h1>
                </div>
                <div class="content">
                    <p>안녕하세요, <strong>{user.name or user.email}</strong>님!</p>
                    <p>주문하신 상품이 발송되었습니다.</p>
                    
                    <div class="tracking-box">
                        <p style="margin: 0; color: #666;">배송 조회번호</p>
                        <p class="tracking-number">{tracking_number}</p>
                        <p style="margin: 0; color: #666;">택배사: {courier}</p>
                    </div>
                    
                    <h3>📦 주문 정보</h3>
                    <p><strong>주문번호:</strong> {order.order_number}</p>
                    
                    <h3>📍 배송지</h3>
                    <p>{order.recipient_name}</p>
                    <p>{order.recipient_address}</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="text-align: center;">
                        <a href="https://konamall.com/tracking/{tracking_number}" 
                           style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                            배송 조회하기
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email.delay(
            to_email=user.email,
            subject=f"[KonaMall] 상품이 발송되었습니다 (#{order.order_number})",
            html_content=html_content
        ).get()
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.notifications.send_delivery_complete")
def send_delivery_complete(order_id: int) -> dict:
    """배송 완료 알림 이메일 발송"""
    db = SessionLocal()
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order or not order.user:
            return {"success": False, "error": "Order or user not found"}
        
        user = order.user
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Pretendard', -apple-system, sans-serif; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
                .emoji {{ font-size: 60px; text-align: center; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 배송이 완료되었습니다!</h1>
                </div>
                <div class="content">
                    <div class="emoji">📦✨</div>
                    <p style="text-align: center; font-size: 18px;">
                        안녕하세요, <strong>{user.name or user.email}</strong>님!<br>
                        주문하신 상품이 배송 완료되었습니다.
                    </p>
                    
                    <h3>📦 주문 정보</h3>
                    <p><strong>주문번호:</strong> {order.order_number}</p>
                    
                    <hr style="margin: 30px 0;">
                    
                    <p style="text-align: center; color: #666;">
                        상품은 만족스러우셨나요?<br>
                        리뷰를 남겨주시면 적립금을 드립니다! 🎁
                    </p>
                    
                    <p style="text-align: center;">
                        <a href="https://konamall.com/orders/{order.order_number}/review" 
                           style="background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                            리뷰 작성하기
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return send_email.delay(
            to_email=user.email,
            subject=f"[KonaMall] 배송이 완료되었습니다! (#{order.order_number})",
            html_content=html_content
        ).get()
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.notifications.send_bulk_promotion")
def send_bulk_promotion(
    user_ids: List[int],
    subject: str,
    html_content: str
) -> dict:
    """대량 프로모션 이메일 발송"""
    db = SessionLocal()
    sent = 0
    failed = 0
    
    try:
        users = db.query(User).filter(
            User.id.in_(user_ids),
            User.is_active == True
        ).all()
        
        for user in users:
            try:
                # 개인화된 내용으로 변환
                personalized_content = html_content.replace(
                    "{{user_name}}", user.name or user.email
                )
                
                send_email.delay(
                    to_email=user.email,
                    subject=subject,
                    html_content=personalized_content
                )
                sent += 1
            except Exception as e:
                logger.error(f"Failed to queue email for user {user.id}: {e}")
                failed += 1
        
        return {
            "total": len(user_ids),
            "sent": sent,
            "failed": failed
        }
        
    finally:
        db.close()
