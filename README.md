# KonaMall - 글로벌 직구 드롭쉬핑 플랫폼

해외 직구 상품(Temu, AliExpress 등)을 한국어로 쉽게 구매할 수 있는 이커머스 플랫폼입니다.

## 🛠 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis + Celery
- **ORM**: SQLAlchemy 2.0
- **Migration**: Alembic
- **Auth**: JWT (python-jose)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Container**: Docker + Docker Compose
- **Proxy**: Nginx (프로덕션)
- **SSL/TLS**: Let's Encrypt

## 📁 프로젝트 구조

```
konamall2/
├── backend/
│   ├── app/
│   │   ├── api/          # API 라우터
│   │   ├── connectors/   # 외부 공급자 연동
│   │   ├── core/         # 설정, 보안
│   │   ├── db/           # 모델, 세션
│   │   └── schemas/      # Pydantic 스키마
│   ├── alembic/          # DB 마이그레이션
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js 페이지
│   │   ├── components/   # React 컴포넌트
│   │   ├── lib/          # 유틸리티
│   │   └── store/        # Zustand 스토어
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## 🚀 시작하기

### 개발 환경 (Docker)

```bash
# 프로젝트 폴더로 이동
cd konamall2

# 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Docker Compose로 실행
docker-compose up -d

# 데이터베이스 마이그레이션
docker-compose exec backend alembic upgrade head
```

### 프로덕션 배포

프로덕션 환경 배포는 [DEPLOYMENT.md](DEPLOYMENT.md) 문서를 참고하세요.

```bash
# 환경 변수 설정
cp .env.production.example .env.production
# .env.production 파일 수정

# 배포 스크립트 실행
./deploy.sh prod    # Linux/Mac
deploy.bat prod     # Windows
```

### 1. Docker로 실행 (권장)

```bash
# 프로젝트 폴더로 이동
cd konamall2

# 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Docker Compose로 실행
docker-compose up -d

# 데이터베이스 마이그레이션
docker-compose exec backend alembic upgrade head
```

### 2. 로컬 개발 환경

#### Backend
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 의존성 설치
pip install -e .

# 환경 변수 설정
cp .env.example .env

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 🌐 접속 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📝 주요 기능

### 상품 관리
- 외부 공급자(Temu, AliExpress) 상품 동기화
- 자동 한글 번역 및 원화 가격 변환
- 상품 검색 및 필터링

### 주문/결제
- 장바구니 기능
- 다양한 결제 수단 지원
- 실시간 주문 상태 추적

### 사용자
- JWT 기반 인증
- 소셜 로그인 (카카오, 구글)
- 주문 내역 조회

### 공급자 연동
- Connector 패턴을 통한 확장 가능한 구조
- 자동 재고 동기화
- 주문 자동 전달

## 🔧 환경 변수

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/konamall
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📜 문서

- 📘 [배포 가이드](DEPLOYMENT.md) - 프로덕션 환경 배포
- 📗 [API 문서](http://localhost:8000/docs) - FastAPI 자동 생성 문서
- 📕 [외부 주문 처리](docs/place_external_orders_README.md)

## 📜 라이선스

MIT License
