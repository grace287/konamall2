# KonaMall 빠른 시작 가이드 (Ubuntu 서버)

서버에 처음 배포할 때 따라하는 간단한 가이드입니다.

## 1단계: 초기 서버 설정

### SSH 접속
```bash
ssh ubuntu@your-server-ip
```

### 시스템 업데이트
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

## 2단계: Docker 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get install docker-compose-plugin -y

# Git 설치
sudo apt-get install git -y
```

## 3단계: Docker 권한 설정 (중요!)

```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 로그아웃 후 다시 접속 (권장)
exit
# 다시 SSH 접속
ssh ubuntu@your-server-ip

# 또는 현재 세션에서 바로 적용
newgrp docker

# 권한 테스트
docker ps
```

**중요**: `docker ps` 명령이 권한 오류 없이 실행되어야 합니다!

## 4단계: 프로젝트 클론

```bash
cd ~
git clone <your-repository-url>
cd konamall2
```

## 5단계: 환경 변수 설정

```bash
# 환경 변수 파일 생성
cp .env.production.example .env.production

# 편집기로 환경 변수 수정
nano .env.production
```

### 필수 설정 항목:
```env
# 강력한 비밀번호로 변경
POSTGRES_PASSWORD=your-strong-password-here
REDIS_PASSWORD=your-redis-password-here

# SECRET_KEY 생성 후 입력
SECRET_KEY=생성된-키-입력

# 도메인 설정
ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### SECRET_KEY 생성:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

생성된 키를 복사하여 `.env.production` 파일의 `SECRET_KEY`에 붙여넣기

## 6단계: SSL 인증서 설정 (개발용)

프로덕션 배포 전 테스트용 자체 서명 인증서 생성:

```bash
# ssl 디렉토리 생성
mkdir -p nginx/ssl

# 자체 서명 인증서 생성
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=KonaMall/CN=localhost"
```

## 7단계: 배포 실행

```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 프로덕션 배포 실행
./deploy.sh prod
```

## 8단계: 상태 확인

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그 확인
docker-compose -f docker-compose.prod.yml logs backend
```

## 접속 테스트

서버 IP로 접속:
- Frontend: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP:8000`
- API Docs: `http://YOUR_SERVER_IP:8000/docs`

## 문제 발생 시

### Docker 권한 오류
```bash
# 권한 확인
groups | grep docker

# docker 그룹에 없다면
sudo usermod -aG docker $USER
exit  # 로그아웃 후 재접속
```

### 포트가 이미 사용 중
```bash
# 사용 중인 포트 확인
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 프로세스 종료
sudo kill -9 <PID>
```

### 컨테이너가 시작되지 않음
```bash
# 로그에서 오류 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart

# 완전히 재빌드
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 다음 단계

1. **도메인 연결**: DNS A 레코드를 서버 IP로 설정
2. **SSL 인증서**: Let's Encrypt로 실제 SSL 인증서 발급
3. **방화벽 설정**: UFW로 80, 443 포트만 개방
4. **백업 설정**: 정기적인 데이터베이스 백업

자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.
