# KonaMall

**글로벌 드롭쉬핑 커머스 플랫폼** — 해외 공급처(Temu, AliExpress 등) 연동, 회원/장바구니/주문/결제(카카오페이·네이버페이), 관리자 대시보드를 갖춘 풀스택 웹 애플리케이션입니다.

---

## 주요 기능

| 구분 | 기능 |
|------|------|
| **회원** | 회원가입, 로그인(JWT), 프로필 조회/수정 |
| **쇼핑** | 상품 목록/상세, 장바구니, 주문 생성 |
| **결제** | 결제 준비·승인·상태 조회 (카카오페이/네이버페이) |
| **관리자** | 대시보드 통계, 회원 목록, 주문 목록 (admin 전용) |
| **백오피스** | 공급처 연동, 상품 동기화, 주문 처리 (Celery) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Redis, Celery |
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, React Hook Form, Axios |
| **인프라** | Docker / Docker Compose, Nginx, GitHub Actions (CI/CD) |

---

## 프로젝트 구조

```
konamall2/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/             # 라우터 (users, products, cart, orders, payments, admin)
│   │   ├── core/            # 설정, 보안, 의존성
│   │   ├── db/              # 모델, 세션
│   │   ├── schemas/         # Pydantic 스키마
│   │   ├── services/        # 결제 게이트웨이 등
│   │   ├── connectors/      # Temu, AliExpress 등 공급처 연동
│   │   └── tasks/           # Celery 태스크 (동기화, 주문 처리)
│   ├── alembic/             # DB 마이그레이션
│   ├── tests/
│   └── pyproject.toml
├── frontend/                # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/             # 페이지 (/, /products, /cart, /login, /signup, /admin)
│   │   ├── components/      # 레이아웃, 홈, 상품
│   │   ├── lib/             # API 클라이언트
│   │   └── store/           # Zustand (auth, cart)
│   └── package.json
├── nginx/                   # 리버스 프록시 설정
├── docs/                    # RUN.md, PROJECT_REVIEW.md 등
├── docker-compose.yml       # 개발 환경
├── docker-compose.prod.yml  # 프로덕션
├── deploy.sh / deploy.bat  # 배포 스크립트
└── .github/workflows/       # CI/CD
```

---

## 요구 사항

- **로컬 실행**: Python 3.11+, Node.js 20+, PostgreSQL 16, Redis 7  
- **Docker 실행**: Docker, Docker Compose

---

## 빠른 시작

### 1) 저장소 클론

```bash
git clone <repository-url>
cd konamall2
```

### 2) Docker로 한 번에 실행 (권장)

```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

- **프론트**: http://localhost:3000  
- **API**: http://localhost:8080  
- **API 문서**: http://localhost:8080/docs  

### 3) 로컬에서 Backend / Frontend 각각 실행

환경 변수 설정 후:

- **Backend**: `cd backend` → `pip install -e ".[dev]"` → `alembic upgrade head` → `uvicorn app.main:app --reload --port 8080`
- **Frontend**: `cd frontend` → `npm ci` → `npm run dev`

자세한 단계·명령어는 **[docs/RUN.md](docs/RUN.md)** 를 참고하세요.

---

## 환경 변수

| 변수 | 설명 | 기본값(개발) |
|------|------|----------------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://postgres:postgres@localhost:5432/konamall` |
| `REDIS_URL` | Redis 연결 문자열 | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT 서명 키 (32자 이상 권장) | (변경 필요) |
| `CORS_ORIGINS` | 허용 오리진 (쉼표 구분 또는 JSON 배열) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | 프론트에서 쓰는 API 베이스 URL | `http://localhost:8080` |

- **Backend**: `backend/.env.example` → `backend/.env`  
- **프로덕션**: `.env.production.example` → `.env.production`  

---

## 문서

| 문서 | 내용 |
|------|------|
| [docs/RUN.md](docs/RUN.md) | 실행 단계 (로컬, Docker, 배포 스크립트, 문제 해결) |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 프로덕션 배포, SSL, 도메인 |
| [QUICKSTART.md](QUICKSTART.md) | Ubuntu 서버 기준 빠른 배포 |
| [docs/PROJECT_REVIEW.md](docs/PROJECT_REVIEW.md) | 로직 검토·개선 요약, 권장 후속 작업 |
| [docs/OPERATION_READINESS.md](docs/OPERATION_READINESS.md) | **운영 가능성 분석**, 치명적/중요 개선점, 체크리스트, 로드맵 |

---

## 스크립트

| 위치 | 명령어 | 설명 |
|------|--------|------|
| Backend | `pytest tests/ -v` | 테스트 |
| Backend | `alembic upgrade head` | DB 마이그레이션 적용 |
| Frontend | `npm run dev` | 개발 서버 |
| Frontend | `npm run build` | 프로덕션 빌드 |
| Frontend | `npm run lint` | ESLint |
| 루트 | `./deploy.sh dev` / `./deploy.sh prod` | Docker 배포 (Linux/Mac) |
| 루트 | `deploy.bat dev` / `deploy.bat prod` | Docker 배포 (Windows) |

---

## 관리자

- **URL**: `/admin` (대시보드, 회원 목록, 주문 목록)
- **접근**: 로그인한 사용자 중 **role이 `admin`** 인 경우만 접근 가능
- **슈퍼관리자·테스트 계정**: `backend`에서 `python -m scripts.seed_users` 실행 시  
  `admin@konamall.local`(admin), `test@konamall.local`(일반) 계정 생성. 자세한 방법은 [docs/RUN.md](docs/RUN.md) 참고.

---

## CI/CD

- **push/PR** (main, develop): Backend 테스트(Postgres/Redis), Frontend lint·build
- **push to main**: Docker 이미지 빌드·푸시(GHCR), 선택적 SSH 배포 (Secrets 설정 시)

---

## 라이선스

프로젝트 정책에 따릅니다.
