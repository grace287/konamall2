# SSL 인증서 발급을 위한 설정 파일
# Let's Encrypt를 사용하여 무료 SSL 인증서를 발급받을 수 있습니다.

## SSL 인증서 발급 방법

### 1. Certbot을 사용한 자동 발급 (권장)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# 인증서를 nginx/ssl 디렉토리로 복사
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

### 2. 자동 갱신 설정

```bash
# Cron job 추가 (매일 자정에 확인)
sudo crontab -e

# 다음 줄 추가
0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /path/to/nginx/ssl/ && docker-compose restart nginx
```

### 3. 자체 서명 인증서 (개발/테스트용)

```bash
# 개발 환경에서만 사용
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx/ssl/privkey.pem \
  -out ./nginx/ssl/fullchain.pem \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=KonaMall/CN=yourdomain.com"
```

## 주의사항

1. **프로덕션 환경**: Let's Encrypt 사용 권장
2. **인증서 갱신**: 90일마다 자동 갱신 필요
3. **도메인 설정**: DNS A 레코드가 서버 IP를 가리켜야 함
4. **방화벽**: 80, 443 포트 개방 필요
