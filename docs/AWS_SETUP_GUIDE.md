# AWS EC2 배포 가이드 (처음부터 완전 가이드)

KonaMall 프로젝트를 AWS EC2에 처음부터 배포하는 전체 과정입니다.

---

## 📋 목차

1. [EC2 인스턴스 생성](#1-ec2-인스턴스-생성)
2. [보안 그룹 설정](#2-보안-그룹-설정)
3. [서버 접속 및 초기 설정](#3-서버-접속-및-초기-설정)
4. [Docker 설치](#4-docker-설치)
5. [프로젝트 배포](#5-프로젝트-배포)
6. [Frontend 문제 해결](#6-frontend-문제-해결)
7. [접속 확인](#7-접속-확인)
8. [문제 해결](#8-문제-해결)

---

## 1. EC2 인스턴스 생성

### 1.1 AWS Console 로그인
- https://console.aws.amazon.com 접속
- EC2 서비스로 이동

### 1.2 인스턴스 시작
1. **인스턴스 시작** 버튼 클릭
2. **이름**: `konamall-server` (또는 원하는 이름)
3. **AMI 선택**: 
   - Ubuntu Server 24.04 LTS (HVM)
   - 64-bit (x86)
4. **인스턴스 유형**: 
   - 개발: `t3.medium` (2 vCPU, 4 GiB RAM) 권장
   - 프로덕션: `t3.large` 이상 권장
5. **키 페어 생성**:
   - 이름: `konamall-key`
   - 유형: RSA
   - 형식: `.pem` (macOS/Linux) 또는 `.ppk` (Windows/PuTTY)
   - **다운로드 후 안전한 곳에 보관**

### 1.3 스토리지 설정
- **크기**: 최소 20 GiB (30 GiB 권장)
- **유형**: gp3 (범용 SSD)

---

## 2. 보안 그룹 설정

### 2.1 새 보안 그룹 생성
인스턴스 생성 시 "보안 그룹 구성" 섹션에서:

```
보안 그룹 이름: konamall-sg
설명: Security group for KonaMall application

인바운드 규칙:
┌─────────┬──────────┬─────────────────┬─────────────────────────────┐
│  유형   │ 프로토콜 │   포트 범위     │         소스                │
├─────────┼──────────┼─────────────────┼─────────────────────────────┤
│  SSH    │   TCP    │       22        │  내 IP (자동 감지)          │
│  HTTP   │   TCP    │       80        │  0.0.0.0/0, ::/0 (전체)     │
│  HTTPS  │   TCP    │      443        │  0.0.0.0/0, ::/0 (전체)     │
│ Custom  │   TCP    │      3000       │  내 IP (개발 확인용)        │
│ Custom  │   TCP    │      8000       │  내 IP (개발 확인용)        │
└─────────┴──────────┴─────────────────┴─────────────────────────────┘
```

**중요**: SSH(22)는 보안을 위해 "내 IP"로만 제한하세요.

### 2.2 Elastic IP 할당 (선택사항)
1. EC2 콘솔 → **Elastic IP** 메뉴
2. **Elastic IP 주소 할당** 클릭
3. 할당된 IP를 인스턴스에 **연결**
4. IP 주소 메모 (예: `52.79.189.107`)

---

## 3. 서버 접속 및 초기 설정

### 3.1 SSH 접속

#### macOS/Linux:
```bash
# 키 파일 권한 설정
chmod 400 ~/Downloads/konamall-key.pem

# SSH 접속
ssh -i ~/Downloads/konamall-key.pem ubuntu@[EC2_PUBLIC_IP]
```

#### Windows (PowerShell):
```powershell
# SSH 접속
ssh -i C:\Users\YourName\Downloads\konamall-key.pem ubuntu@[EC2_PUBLIC_IP]
```

#### Windows (PuTTY):
1. PuTTY 실행
2. Host Name: `ubuntu@[EC2_PUBLIC_IP]`
3. Connection → SSH → Auth → Private key: `.ppk` 파일 선택
4. Open 클릭

### 3.2 시스템 업데이트
```bash
# 패키지 목록 업데이트
sudo apt update

# 시스템 업그레이드
sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y curl wget git vim
```

---

## 4. Docker 설치

### 4.1 Docker 설치 스크립트
```bash
# Docker 공식 설치 스크립트 실행
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker 버전 확인
docker --version
```

### 4.2 Docker 권한 설정
```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 그룹 변경 적용 (재로그인 대신)
newgrp docker

# 권한 확인
docker ps
```

**출력 예시**: `CONTAINER ID   IMAGE   ...` (에러 없이 목록 표시)

### 4.3 Docker Compose 설치
```bash
# Docker Compose V2 설치 (이미 포함되어 있을 수 있음)
sudo apt install -y docker-compose-plugin

# 버전 확인
docker compose version
```

**또는 legacy docker-compose 사용**:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

## 5. 프로젝트 배포

### 5.1 Git 저장소 클론
```bash
# 홈 디렉토리로 이동
cd ~

# 프로젝트 클론
git clone https://github.com/grace287/konamall2.git

# 프로젝트 디렉토리로 이동
cd konamall2
```

### 5.2 환경 변수 설정 (선택사항)
개발 환경에서는 docker-compose.yml의 기본 설정을 사용합니다.

프로덕션 환경이라면:
```bash
# .env 파일 생성
cp .env.production.example .env.production

# 환경 변수 편집
vim .env.production
```

### 5.3 Docker 이미지 빌드
```bash
# 모든 서비스 빌드
docker compose build

# 또는 legacy 버전
# docker-compose build
```

**예상 시간**: 5-10분 (처음 빌드 시)

### 5.4 컨테이너 시작
```bash
# 백그라운드로 모든 서비스 시작
docker compose up -d

# 또는
# docker-compose up -d
```

### 5.5 상태 확인
```bash
# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f
```

**예상 결과**:
```
NAME                COMMAND                  SERVICE    STATUS         PORTS
konamall-backend    "uvicorn app.main:app"   backend    Up             0.0.0.0:8000->8000/tcp
konamall-celery     "celery -A app..."       celery     Up             
konamall-frontend   "npm run dev"            frontend   Exit 127       ← 문제!
konamall-nginx      "/docker-entrypoint"     nginx      Up             0.0.0.0:80->80/tcp
konamall-postgres   "docker-entrypoint..."   postgres   Up (healthy)   0.0.0.0:5432->5432/tcp
konamall-redis      "docker-entrypoint..."   redis      Up (healthy)   0.0.0.0:6379->6379/tcp
```

---

## 6. Frontend 문제 해결

Frontend 컨테이너가 **Exit 127**로 종료되는 경우:

### 6.1 문제 원인
`sh: next: not found` - node_modules가 volume 마운트로 덮어씌워짐

### 6.2 해결 방법

#### 방법 1: npm install 직접 실행 (권장)
```bash
cd ~/konamall2

# Frontend 컨테이너에서 npm install 실행
docker compose run --rm --no-deps frontend sh -c "cd /app && npm install"

# 컨테이너 재시작
docker compose up -d frontend

# 상태 확인
docker compose ps
```

#### 방법 2: 호스트에서 npm install
```bash
cd ~/konamall2/frontend

# 임시 컨테이너로 npm install
docker compose run --rm --no-deps frontend npm install

# 프로젝트 루트로 이동
cd ..

# Frontend 재시작
docker compose up -d frontend
```

#### 방법 3: Volume 재생성
```bash
cd ~/konamall2

# 모든 컨테이너 중지 및 제거
docker compose down

# Frontend 이미지 재빌드
docker compose build --no-cache frontend

# 다시 시작
docker compose up -d

# Frontend 컨테이너에서 npm install
docker compose exec frontend npm install

# Frontend 재시작
docker compose restart frontend
```

### 6.3 성공 확인
```bash
# 컨테이너 상태 - 모두 "Up" 이어야 함
docker compose ps

# Frontend 로그 - 에러 없이 실행 중
docker compose logs frontend

# 예상 출력:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# ✓ Ready in 2.5s
```

---

## 7. 접속 확인

### 7.1 헬스체크
```bash
# 서버 내부에서
curl http://localhost/health

# 예상 출력: healthy
```

### 7.2 브라우저 접속

외부에서 브라우저로 접속:

- **Frontend**: `http://[EC2_PUBLIC_IP]` 또는 `http://52.79.189.107`
- **API Docs**: `http://[EC2_PUBLIC_IP]/docs`
- **Backend API**: `http://[EC2_PUBLIC_IP]/api/`

### 7.3 직접 포트 접속 (개발용)
```bash
# Frontend (포트 3000)
curl http://localhost:3000

# Backend (포트 8000)
curl http://localhost:8000/docs
```

---

## 8. 문제 해결

### 8.1 컨테이너가 시작되지 않음
```bash
# 로그 확인
docker compose logs [서비스명]

# 예시
docker compose logs backend
docker compose logs frontend
docker compose logs nginx

# 모든 로그 실시간 확인
docker compose logs -f
```

### 8.2 포트 80 접속 안 됨 (502 Bad Gateway)
```bash
# Nginx 상태 확인
docker compose ps nginx

# Nginx 로그 확인
docker compose logs nginx

# Nginx 설정 테스트
docker compose exec nginx nginx -t

# Frontend/Backend 상태 확인
docker compose ps
```

### 8.3 Database 연결 오류
```bash
# PostgreSQL 상태 확인
docker compose ps postgres

# PostgreSQL 로그
docker compose logs postgres

# 컨테이너 내부 접속
docker compose exec postgres psql -U postgres -d konamall

# 테이블 확인
\dt
```

### 8.4 Redis 연결 오류
```bash
# Redis 상태 확인
docker compose ps redis

# Redis 연결 테스트
docker compose exec redis redis-cli ping

# 예상 출력: PONG
```

### 8.5 전체 재시작
```bash
cd ~/konamall2

# 모든 컨테이너 중지 및 제거
docker compose down

# 볼륨까지 제거 (데이터베이스 초기화됨)
docker compose down -v

# 이미지 재빌드
docker compose build

# 다시 시작
docker compose up -d

# 상태 확인
docker compose ps
```

### 8.6 디스크 공간 부족
```bash
# 디스크 사용량 확인
df -h

# Docker 정리
docker system prune -a

# 사용하지 않는 이미지 제거
docker image prune -a

# 사용하지 않는 볼륨 제거 (주의: 데이터 손실)
docker volume prune
```

### 8.7 메모리 부족
```bash
# 메모리 사용량 확인
free -h

# 컨테이너별 리소스 사용량
docker stats

# Celery 컨테이너 중지 (필요시)
docker compose stop celery
```

---

## 📌 빠른 명령어 참고

### 일상 운영
```bash
# 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f [서비스명]

# 컨테이너 재시작
docker compose restart [서비스명]

# 컨테이너 중지
docker compose stop

# 컨테이너 시작
docker compose start

# 전체 재시작
docker compose restart
```

### 코드 업데이트 후 배포
```bash
cd ~/konamall2

# 최신 코드 가져오기
git pull origin main

# 이미지 재빌드 (변경사항 있는 경우)
docker compose build

# 컨테이너 재시작
docker compose up -d

# 로그 확인
docker compose logs -f
```

### 백업
```bash
# PostgreSQL 백업
docker compose exec -T postgres pg_dump -U postgres konamall > backup_$(date +%Y%m%d).sql

# Redis 백업
docker compose exec redis redis-cli SAVE
```

---

## 🎯 체크리스트

배포 완료 전 확인사항:

- [ ] EC2 인스턴스 생성 및 Elastic IP 할당
- [ ] 보안 그룹 설정 (SSH, HTTP, HTTPS)
- [ ] Docker & Docker Compose 설치
- [ ] 프로젝트 클론 완료
- [ ] 모든 컨테이너 "Up" 상태
- [ ] Frontend 접속 가능 (`http://[PUBLIC_IP]`)
- [ ] Backend API Docs 접속 가능 (`http://[PUBLIC_IP]/docs`)
- [ ] Nginx 헬스체크 성공 (`http://[PUBLIC_IP]/health`)
- [ ] PostgreSQL 정상 작동
- [ ] Redis 정상 작동

---

## 🔐 보안 권장사항

### 프로덕션 배포 시 필수
1. **환경 변수 보안**
   - `.env.production` 파일에 강력한 비밀번호 설정
   - `SECRET_KEY` 32자 이상 랜덤 생성
   
2. **SSL 인증서 설치**
   - Let's Encrypt 사용 권장
   - `nginx/conf.d/default.conf.prod` 활성화
   
3. **방화벽 강화**
   - SSH 포트는 특정 IP로만 제한
   - 개발 포트(3000, 8000) 외부 접근 차단
   
4. **정기 업데이트**
   ```bash
   sudo apt update && sudo apt upgrade -y
   docker compose pull
   docker compose up -d
   ```

---

## 📞 추가 도움말

### 문서 참고
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 상세 배포 가이드
- [QUICKSTART.md](../QUICKSTART.md) - 빠른 시작 가이드
- [nginx/conf.d/README.md](../nginx/conf.d/README.md) - Nginx 설정 가이드

### 로그 위치
- Nginx: `docker compose logs nginx`
- Backend: `docker compose logs backend`
- Frontend: `docker compose logs frontend`
- PostgreSQL: `docker compose logs postgres`

### 유용한 링크
- Docker Compose 문서: https://docs.docker.com/compose/
- Next.js 문서: https://nextjs.org/docs
- FastAPI 문서: https://fastapi.tiangolo.com/

---

**작성일**: 2026-01-27  
**프로젝트**: KonaMall v2  
**Repository**: https://github.com/grace287/konamall2
