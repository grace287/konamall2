# KonaMall 배포 가이드

이 문서는 KonaMall 프로젝트를 프로덕션 환경에 배포하는 방법을 설명합니다.

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [환경 설정](#환경-설정)
3. [배포 단계](#배포-단계)
4. [SSL 인증서 설정](#ssl-인증서-설정)
5. [도메인 설정](#도메인-설정)
6. [모니터링](#모니터링)
7. [문제 해결](#문제-해결)

---

## 🔧 사전 요구사항

### 서버 요구사항
- **운영 체제**: Ubuntu 20.04 LTS 이상 (또는 다른 Linux 배포판)
- **메모리**: 최소 4GB RAM (권장 8GB 이상)
- **디스크**: 최소 20GB 여유 공간
- **CPU**: 최소 2 코어 (권장 4 코어 이상)

### 설치 필요 소프트웨어
- Docker (20.10 이상)
- Docker Compose (2.0 이상)
- Git

### 설치 명령어 (Ubuntu)
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Git 설치
sudo apt-get install git

# Docker 권한 설정 (필수!)
sudo usermod -aG docker $USER

# 권한 적용 - 다음 중 하나 선택:
# 방법 1: 즉시 적용 (현재 세션에만)
newgrp docker

# 방법 2: 로그아웃 후 재로그인 (완전 적용, 권장)
# exit를 입력하고 다시 SSH 접속

# Docker 설치 확인
docker --version
docker-compose --version
docker ps  # 권한 테스트
```

---

## ⚙️ 환경 설정

### 1. 저장소 클론

```bash
git clone <your-repository-url>
cd konamall2
```

### 2. 환경 변수 설정

```bash
# .env.production.example을 복사하여 .env.production 생성
cp .env.production.example .env.production

# 환경 변수 편집
nano .env.production
```

### 필수 환경 변수 설정

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=강력한_비밀번호_입력
POSTGRES_DB=konamall

# Redis
REDIS_PASSWORD=강력한_Redis_비밀번호

# Backend
SECRET_KEY=최소_32자_이상의_무작위_문자열
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Domain
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com
```

### SECRET_KEY 생성 방법

```bash
# Python을 사용하여 랜덤 키 생성
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🚀 배포 단계

### 방법 1: 자동 배포 스크립트 사용 (권장)

#### Linux/Mac:
```bash
# 실행 권한 부여
chmod +x deploy.sh

# 개발 환경 배포
./deploy.sh dev

# 프로덕션 환경 배포
./deploy.sh prod
```

#### Windows:
```cmd
REM 개발 환경 배포
deploy.bat dev

REM 프로덕션 환경 배포
deploy.bat prod
```

### 방법 2: 수동 배포

```bash
# 1. 이미지 빌드
docker-compose -f docker-compose.prod.yml build

# 2. 컨테이너 시작
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. 데이터베이스 마이그레이션
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# 4. 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔒 SSL 인증서 설정

### Let's Encrypt를 사용한 무료 SSL 인증서

#### 1. Certbot 설치

```bash
sudo apt-get update
sudo apt-get install certbot
```

#### 2. 인증서 발급

```bash
# HTTP-01 챌린지 사용
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

#### 3. 인증서 복사

```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
sudo chmod 644 ./nginx/ssl/*.pem
```

#### 4. 자동 갱신 설정

```bash
# Cron job 추가
sudo crontab -e

# 다음 줄 추가 (매일 자정에 확인)
0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /path/to/konamall2/nginx/ssl/ && cd /path/to/konamall2 && docker-compose -f docker-compose.prod.yml restart nginx
```

### 개발 환경용 자체 서명 인증서

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=KonaMall/CN=localhost"
```

---

## 🌐 도메인 설정

### DNS 레코드 설정

도메인 제공업체(예: Cloudflare, GoDaddy)에서 다음 DNS 레코드를 추가하세요:

```
Type    Name              Value           TTL
A       @                 YOUR_SERVER_IP  Auto
A       www               YOUR_SERVER_IP  Auto
A       api               YOUR_SERVER_IP  Auto
```

### Nginx 설정 업데이트

`nginx/conf.d/default.conf` 파일에서 `yourdomain.com`을 실제 도메인으로 변경:

```bash
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx/conf.d/default.conf
```

---

## 📊 모니터링

### 로그 확인

```bash
# 모든 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx

# 최근 100줄만 보기
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너
docker-compose -f docker-compose.prod.yml ps

# 리소스 사용량
docker stats

# 디스크 사용량
docker system df
```

### 서비스 헬스체크

```bash
# Backend API 헬스체크
curl https://api.yourdomain.com/health

# Frontend 확인
curl https://yourdomain.com
```

---

## 🔧 유용한 명령어

### 서비스 관리

```bash
# 서비스 재시작
docker-compose -f docker-compose.prod.yml restart

# 특정 서비스 재시작
docker-compose -f docker-compose.prod.yml restart backend

# 서비스 중지
docker-compose -f docker-compose.prod.yml stop

# 서비스 중지 및 제거
docker-compose -f docker-compose.prod.yml down

# 볼륨까지 완전 제거
docker-compose -f docker-compose.prod.yml down -v
```

### 컨테이너 접속

```bash
# Backend 컨테이너 쉘 접속
docker-compose -f docker-compose.prod.yml exec backend bash

# Database 컨테이너 접속
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d konamall

# Redis 컨테이너 접속
docker-compose -f docker-compose.prod.yml exec redis redis-cli -a ${REDIS_PASSWORD}
```

### 데이터베이스 백업

```bash
# PostgreSQL 백업
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres konamall > backup_$(date +%Y%m%d_%H%M%S).sql

# PostgreSQL 복원
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres konamall
```

---

## ❗ 문제 해결

### Docker 권한 오류 (Permission Denied)

Docker 명령어 실행 시 `Permission denied` 오류가 발생하는 경우:

```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 그룹 변경사항 즉시 적용 (방법 1: 권장)
newgrp docker

# 또는 로그아웃 후 다시 로그인 (방법 2)
# exit 후 다시 SSH 접속

# 권한 확인
groups
docker ps

# 임시 해결책: sudo 사용 (권장하지 않음)
sudo docker-compose -f docker-compose.prod.yml build
```

**중요**: `newgrp docker` 실행 후에도 권한이 없다면, 완전히 로그아웃한 뒤 다시 SSH 접속해야 합니다.

### 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 재생성
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### 포트 충돌

```bash
# 포트 사용 확인
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 프로세스 종료
sudo kill -9 <PID>
```

### 디스크 공간 부족

```bash
# 사용하지 않는 이미지 제거
docker image prune -a

# 사용하지 않는 볼륨 제거
docker volume prune

# 전체 정리
docker system prune -a --volumes
```

### SSL 인증서 오류

```bash
# 인증서 확인
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# 인증서 권한 확인
ls -la nginx/ssl/

# Nginx 설정 테스트
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps postgres

# 데이터베이스 연결 테스트
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.db.session import engine; engine.connect()"
```

### Frontend 빌드 오류 (Module not found)

`Module not found: Can't resolve '@/lib/api'` 같은 오류가 발생하는 경우:

```bash
# 서버에서 파일 존재 확인
cd ~/konamall2/frontend
ls -la src/lib/

# 파일이 없다면 최신 코드 가져오기
git fetch origin
git reset --hard origin/main

# 캐시 없이 재빌드
sudo docker-compose build --no-cache frontend
sudo docker-compose up -d
```

**원인**: `.gitignore` 설정으로 인해 필요한 파일이 Git에 커밋되지 않았을 수 있습니다.

---

## 🔐 보안 체크리스트

- [ ] `.env.production` 파일의 모든 비밀번호를 강력한 것으로 변경
- [ ] `SECRET_KEY`를 랜덤하게 생성된 값으로 설정
- [ ] `DEBUG=false`로 설정
- [ ] SSL 인증서 설치 및 HTTPS 활성화
- [ ] 방화벽 설정 (80, 443 포트만 개방)
- [ ] 정기적인 백업 설정
- [ ] 로그 모니터링 설정
- [ ] `.env` 파일을 `.gitignore`에 추가

---

## 📚 추가 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [Let's Encrypt 문서](https://letsencrypt.org/docs/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)

---

## 📞 지원

문제가 발생하면 GitHub Issues에 문의하세요.
