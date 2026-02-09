# KonaMall 실행 단계

로컬 개발·Docker·프로덕션까지 **실행 순서**와 **명령어**를 단계별로 정리한 문서입니다.

---

## 목차

1. [로컬 개발 (Docker 없이)](#1-로컬-개발-docker-없이)
2. [Docker Compose로 한 번에 실행](#2-docker-compose로-한-번에-실행)
3. [배포 스크립트로 실행](#3-배포-스크립트로-실행)
4. [프로덕션 수동 실행](#4-프로덕션-수동-실행)
5. [실행 후 확인](#5-실행-후-확인)
6. [자주 쓰는 명령어](#6-자주-쓰는-명령어)

---

## 1. 로컬 개발 (Docker 없이)

Backend / Frontend를 각각 터미널에서 띄우는 방식입니다. **PostgreSQL·Redis는 미리 실행**되어 있어야 합니다.

### 1.1 사전 요구사항

- Python 3.11+
- Node.js 20+
- PostgreSQL 16 (로컬 또는 Docker로만 DB만 실행)
- Redis 7 (로컬 또는 Docker로만 실행)

### 1.2 DB·Redis만 Docker로 실행 (선택)

```bash
# 프로젝트 루트에서
docker run -d --name konamall-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=konamall -p 5432:5432 postgres:16-alpine
docker run -d --name konamall-redis -p 6379:6379 redis:7-alpine
```

### 1.3 백엔드 실행

```bash
# 1) 프로젝트 루트에서 backend로 이동
cd backend

# 2) 가상환경 생성·활성화 (선택)
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate

# 3) 의존성 설치
pip install -e ".[dev]"

# 4) 환경 변수 설정 (.env 파일 또는 export)
# backend/.env 예시 (backend/.env.example 복사 후 수정)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/konamall
# REDIS_URL=redis://localhost:6379/0
# SECRET_KEY=your-secret-key-min-32-chars

# 5) 마이그레이션 적용 (PostgreSQL가 실행 중이어야 함)
#    DB가 없으면 위 1.2의 docker run으로 Postgres를 먼저 띄운 뒤 실행
alembic upgrade head

# 6) API 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

- 정상이면 **http://localhost:8080** 에서 API, **http://localhost:8080/docs** 에서 Swagger UI 확인.

### 1.4 Celery 워커 실행 (선택, 비동기 작업용)

```bash
# backend 디렉터리에서, 백엔드와 동일한 .env 사용
celery -A app.celery_app worker --loglevel=info
```

### 1.5 프론트엔드 실행

**새 터미널**에서:

```bash
# 1) 프로젝트 루트에서 frontend로 이동
cd frontend

# 2) 의존성 설치
npm ci
# 또는
npm install

# 3) API 주소 설정
# frontend/.env.local 생성 (또는 .env)
# NEXT_PUBLIC_API_URL=http://localhost:8080

# 4) 개발 서버 실행
npm run dev
```

- 정상이면 **http://localhost:3000** 에서 프론트 접속.

### 1.6 로컬 실행 순서 요약

| 순서 | 대상        | 명령어 / 위치 |
|------|-------------|----------------|
| 1    | Postgres, Redis | Docker 또는 로컬 설치 후 실행 |
| 2    | Backend     | `cd backend` → `alembic upgrade head` → `uvicorn app.main:app --reload --port 8080` |
| 3    | (선택) Celery | `cd backend` → `celery -A app.celery_app worker --loglevel=info` |
| 4    | Frontend    | `cd frontend` → `npm run dev` |

---

## 2. Docker Compose로 한 번에 실행

전체 스택을 **한 번에** 띄우는 방식입니다.

### 2.1 개발 환경 (docker-compose.yml)

```bash
# 프로젝트 루트에서 (postgres, redis, backend, frontend 등 전체 기동)
docker compose up -d --build

# Postgres·Redis만 띄우고 나머지는 로컬에서 실행하려면
docker compose up -d postgres redis

# 또는 포그라운드(로그 보기)
docker compose up --build
```

- 첫 실행 후 DB 마이그레이션 한 번 실행:

```bash
docker compose exec backend alembic upgrade head
```

### 2.2 접속 주소 (개발)

| 서비스   | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| API Docs | http://localhost:8080/docs |
| Nginx (80) | http://localhost (프록시) |

### 2.3 중지·삭제

```bash
docker compose down
# 볼륨까지 삭제
docker compose down -v
```

---

## 3. 배포 스크립트로 실행

`deploy.sh`(Linux/Mac) 또는 `deploy.bat`(Windows)를 사용하는 방법입니다.

### 3.1 Linux / Mac

```bash
# 실행 권한 부여 (최초 1회)
chmod +x deploy.sh

# 개발 환경
./deploy.sh dev

# 프로덕션 환경 (.env.production 필요)
./deploy.sh prod
```

### 3.2 Windows

```cmd
deploy.bat dev
REM 또는
deploy.bat prod
```

### 3.3 스크립트가 하는 일 (요약)

1. Docker / Docker Compose 존재 여부 확인  
2. `git pull` (저장소가 있을 때)  
3. 이미지 빌드  
4. 기존 컨테이너 중지 후 새로 up  
5. DB 마이그레이션: `alembic upgrade head`  
6. 컨테이너 상태 출력  

- **prod** 사용 시 루트의 `.env.production` 이 필요합니다 (없으면 `.env.production.example` 참고해 생성).

---

## 4. 프로덕션 수동 실행

Docker Compose로 프로덕션 설정만 수동 실행하는 단계입니다.

### 4.1 환경 파일 준비

```bash
cp .env.production.example .env.production
# .env.production 편집: 비밀번호, 도메인, SECRET_KEY 등
```

### 4.2 실행 단계

```bash
# 1) 이미지 빌드
docker compose -f docker-compose.prod.yml build

# 2) 컨테이너 기동
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3) 마이그레이션
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 4.3 중지

```bash
docker compose -f docker-compose.prod.yml down
```

---

## 5. 실행 후 확인

### 5.1 API 상태

```bash
curl http://localhost:8080/health
# 예상: {"status":"healthy"}
```

### 5.2 DB 마이그레이션 상태

```bash
# Docker 사용 시
docker compose exec backend alembic current

# 로컬 backend 디렉터리에서
cd backend && alembic current
```

### 5.3 컨테이너 상태 (Docker 사용 시)

```bash
docker compose ps
# 또는 프로덕션
docker compose -f docker-compose.prod.yml ps
```

---

## 6. 자주 쓰는 명령어

| 목적 | 명령어 |
|------|--------|
| 전체 로그 보기 | `docker compose logs -f` |
| Backend 로그만 | `docker compose logs -f backend` |
| Backend 셸 접속 | `docker compose exec backend bash` |
| DB 마이그레이션 | `docker compose exec backend alembic upgrade head` |
| 마이그레이션 현황 | `docker compose exec backend alembic current` |
| 전체 중지 | `docker compose down` |
| 중지 + 볼륨 삭제 | `docker compose down -v` |
| 프론트 빌드만 (로컬) | `cd frontend && npm run build` |
| 백엔드 테스트 (로컬) | `cd backend && pytest tests/ -v` |

---

실제 서버 배포·SSL·도메인 설정은 [DEPLOYMENT.md](../DEPLOYMENT.md), 처음 서버 세팅은 [QUICKSTART.md](../QUICKSTART.md)를 참고하면 됩니다.

---

## 7. 문제 해결

### alembic upgrade head — Connection refused (localhost:5432)

PostgreSQL가 켜져 있지 않을 때 발생합니다.

1. **Postgres만 Docker로 실행** (프로젝트 루트에서):
   ```bash
   docker run -d --name konamall-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=konamall -p 5432:5432 postgres:16-alpine
   ```
2. **이미 컨테이너가 있으면 시작**:
   ```bash
   docker start konamall-postgres
   ```
3. 몇 초 후 `cd backend` → `alembic upgrade head` 다시 실행.

### ChunkLoadError (layout.js timeout)

개발 중 `Loading chunk app/layout failed (timeout)` 가 나오면:

1. **개발 서버 중지** 후 프로젝트 루트에서:
   ```bash
   cd frontend
   rm -rf .next
   # Windows: rmdir /s /q .next
   npm run dev
   ```
2. `next.config.mjs` 에서 프로덕션 빌드 시에만 `output: 'standalone'` 이 적용되도록 되어 있으면, 개발 시 청크 로딩이 안정됩니다.

### 슈퍼관리자 계정 만들기

관리자 페이지(`/admin`)는 **role이 admin인 사용자**만 접근 가능합니다.

- **방법 1: 시드 스크립트 (권장)**  
  슈퍼관리자 + 일반 테스트 계정을 한 번에 생성:
  ```bash
  cd backend
  # .env 또는 DATABASE_URL 설정 후
  python -m scripts.seed_users
  ```
  생성되는 계정:
  | 구분 | 이메일 | 비밀번호 | 용도 |
  |------|--------|----------|------|
  | 슈퍼관리자 | admin@konamall.local | admin123! | /admin 접속 |
  | 테스트 회원 | test@konamall.local | test123! | /login 일반 로그인 테스트 |

- **방법 2: DB에서 직접**  
  이미 회원가입한 이메일이 있으면:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
  ```

### 일반 로그인 테스트 계정

- **방법 1:** 위 시드 스크립트 실행 → `test@konamall.local` / `test123!` 로 로그인.
- **방법 2:** 프론트에서 `/signup` 으로 회원가입 후 `/login` 에서 해당 이메일·비밀번호로 로그인.
