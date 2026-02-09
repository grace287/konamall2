# KonaMall 프로젝트 로직 검토 및 개선 요약

- **실행 단계**: 로컬/Docker/배포 스크립트별 실행 순서와 명령어는 [RUN.md](RUN.md) 참고.
- **프로젝트 개요·빠른 시작**: [README.md](../README.md) 참고.
- **운영 가능성·배포 전 체크리스트**: [OPERATION_READINESS.md](OPERATION_READINESS.md) 참고.

---

## 전체 프로젝트 검토 체크리스트

### 구조·일관성

| 항목 | 상태 | 비고 |
|------|------|------|
| 백엔드 라우터 분리 (users, products, cart, orders, payments, admin) | ✅ | main에서 prefix 일관 |
| DB 모델·마이그레이션 동기화 | ✅ | 001 + 002, models.py 정리 |
| 프론트 App Router 구조 | ✅ | /, /products, /cart, /login, /signup, /admin |
| 환경 변수·설정 분리 | ✅ | .env.example, config.py, CORS 파싱 보강 |

### 보안·인증

| 항목 | 상태 | 비고 |
|------|------|------|
| JWT 인증 (access token) | ✅ | Bearer, /api/users/me |
| 비밀번호 해시 (bcrypt) | ✅ | 회원가입·로그인 |
| 관리자 전용 API (role=admin) | ✅ | /api/admin/*, get_admin_user |
| CORS 설정 | ✅ | 설정값·쉼표/JSON 파싱 지원 |

### API·비즈니스 로직

| 항목 | 상태 | 비고 |
|------|------|------|
| 회원가입·로그인 (JSON 포함) | ✅ | /register, /login/json, UserOut·role |
| 장바구니 CRUD | ✅ | variant_info 기반 (001 호환) |
| 주문 생성·목록·상세 | ✅ | 장바구니 기반, address_id |
| 결제 준비·승인·상태 | ✅ | 승인 시 Order.paid_at·status 반영 |
| 관리자: 회원/주문 목록·통계 | ✅ | /api/admin/users, orders, stats |

### 프론트엔드

| 항목 | 상태 | 비고 |
|------|------|------|
| API 클라이언트 (axios + Bearer) | ✅ | lib/api.ts, localStorage auth |
| 로그인/회원가입 폼·검증 | ✅ | react-hook-form, 에러 메시지 |
| 관리자 페이지·권한 체크 | ✅ | /admin, /api/users/me role |
| ChunkLoadError 대응 | ✅ | next.config (standalone 조건), RUN.md 안내 |

### 인프라·배포

| 항목 | 상태 | 비고 |
|------|------|------|
| Docker Compose (dev/prod) | ✅ | docker-compose.yml, .prod.yml |
| CI (테스트·빌드) | ✅ | Backend pytest, Frontend lint·build |
| CD (이미지·배포) | ✅ | main 푸시 시 빌드·푸시, 선택 SSH 배포 |
| 문서 (RUN, DEPLOYMENT, README) | ✅ | 실행·배포·개요 정리 |

---

## 적용된 개선 사항

1. **Cursor Rules** (.cursor/rules): 프로젝트·백엔드·프론트 공통 규칙
2. **GitHub CI/CD**: concurrency, alembic, coverage optional, deploy continue-on-error
3. **DB models·마이그레이션 002**: ProductVariant, variant_id, order_id 등
4. **Orders/Payments API**: 주문 생성·결제 승인 시 주문 상태 반영
5. **관리자 API·페이지**: /api/admin/*, /admin 대시보드·회원·주문
6. **로그인 응답**: user + token (JSON 로그인 엔드포인트), role 저장
7. **UserOut role**: DB customer/admin/seller와 호환 (Optional[str])
8. **CORS_ORIGINS**: env에서 쉼표 구분 또는 JSON 배열 파싱
9. **README**: 프로젝트 소개, 구조, 빠른 시작, 문서 링크, 관리자 안내

---

## 권장 후속 작업

- **결제 플로우**: 프론트 checkout 페이지에서 주소 선택 → 주문 생성 → 결제 준비 → PG 리다이렉트 → 승인 콜백 시 `order_id` 포함해 `/api/payments/approve` 호출
- **배포 Secrets**: `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, (선택) `PRODUCTION_DEPLOY_PATH`
- **상품 번역**: product_sync 내 번역 API 연동 (현재 placeholder)
- **테스트 보강**: Backend API·서비스 단위 테스트, Frontend 중요 플로우 E2E
- **에러 로깅**: 프로덕션용 구조화 로깅·모니터링

---

## 1. Cursor Rules (.cursor/rules)

- **project-conventions.mdc**: 프로젝트 공통 규칙(구조, 스타일, 보안, DB) — `alwaysApply: true`
- **backend-python.mdc**: 백엔드 Python/FastAPI 규칙 — `backend/**/*.py`
- **frontend-react.mdc**: 프론트엔드 Next.js/React/TypeScript 규칙 — `frontend/**/*.{ts,tsx}`

## 2. GitHub CI/CD (.github/workflows/ci-cd.yml)

- **concurrency**: 동일 브랜치 중복 실행 취소
- **test-backend**: Python 3.12, Postgres/Redis 서비스, **alembic upgrade head** 후 pytest 실행, coverage 업로드(실패해도 CI 통과)
- **test-frontend**: Node 20, npm ci, lint, build (NEXT_PUBLIC_API_URL 설정)
- **build-and-push**: main 푸시 시에만 backend/frontend Docker 이미지 빌드·푸시 (GHCR)
- **deploy**: main 푸시 시 SSH 배포, `continue-on-error: true`로 배포 비밀키 미설정 시에도 워크플로 실패 방지

## 3. 백엔드 로직 복구·개선

### 3.1 DB 모델 (app/db/models.py)

- **001 스키마 기준**으로 모델 복구: Supplier, User, Address, Product, ProductImage, Cart, CartItem, Order, OrderItem, ExternalOrder, Shipment, ShipmentEvent
- **ProductVariant** 추가(002 마이그레이션에서 테이블 생성)
- **호환 속성**: `Order.shipping_name` 등 → `recipient_*`, `Product.price_final` → `selling_price`, `ProductImage.is_main` → `is_primary`, `Supplier.supplier_type` → `connector_type`
- **ExternalOrder**: 002에서 `order_id` 컬럼 추가(코드에서 order 기준 조회용)

### 3.2 마이그레이션 002 (alembic/versions/002_*.py)

- `product_variants` 테이블 생성
- `cart_items.variant_id`, `order_items.variant_id` 추가
- `external_orders.order_id` 추가

### 3.3 Orders API (app/api/orders.py)

- `GET /api/orders`: 내 주문 목록(페이지네이션)
- `GET /api/orders/{order_id}`: 주문 상세(본인만)
- `POST /api/orders`: 장바구니 기반 주문 생성(`address_id`, `payment_method`, `note`), 주문 번호 생성 후 장바구니 비우기

### 3.4 Payments API (app/api/payments.py)

- `POST /api/payments/prepare`: 결제 준비(order_id, gateway) → payment_url 등 반환
- `POST /api/payments/approve`: order_id, pg_token으로 결제 승인 후 **Order.paid_at, payment_id, status=PAID 반영**
- `GET /api/payments/status/{payment_id}`: 결제 상태 조회

### 3.5 Cart API (app/api/cart.py)

- 001 전용: `variant_id` 없이 `variant_info`(JSON)만 사용하도록 수정
- 002 적용 시 모델의 `variant_id` 컬럼 사용 가능(선택)

### 3.6 기타 수정

- **product_sync**: Product 컬럼명 정리(name, name_ko, original_price, selling_price, synced_at, external_url), ProductImage `is_primary`, ProductVariant `price_krw`만 사용, SupplierType 제거
- **order_process**: 모델의 `Order.external_orders` 관계 및 `ExternalOrder.order_id`(002) 사용

## 4. 테스트

- **backend/tests/test_health.py**: `GET /health`, `GET /` 검증
- CI에서 `alembic upgrade head` 후 `pytest tests/` 실행
