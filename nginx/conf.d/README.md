# Nginx Configuration Files

이 디렉토리에는 두 가지 Nginx 설정 파일이 있습니다:

## 파일 설명

### `default.conf`
**현재 사용 중인 설정 파일**
- 개발 환경용 HTTP 설정 (포트 80)
- SSL 인증서 불필요
- localhost 및 서버 IP로 접속 가능

### `default.conf.prod`
**프로덕션 환경용 설정 파일**
- HTTPS 설정 (포트 443)
- SSL 인증서 필요
- 도메인 기반 라우팅
- HTTP → HTTPS 리다이렉트
- Rate limiting 적용

### `dev.conf`
**개발 설정 원본**
- default.conf의 소스 파일
- 참고용으로 보관

## 환경 전환 방법

### 개발 환경으로 전환
```bash
cp dev.conf default.conf
docker-compose restart nginx
```

### 프로덕션 환경으로 전환
```bash
# 1. SSL 인증서 설치 필요
# 2. default.conf.prod에서 도메인 수정
# 3. 설정 적용
cp default.conf.prod default.conf
docker-compose restart nginx
```

## 주요 라우팅 규칙

- `/` → Frontend (Next.js:3000)
- `/api/` → Backend (FastAPI:8000)
- `/docs` → API 문서
- `/health` → 헬스체크 엔드포인트

## 개발 환경 특이사항

- **HMR 지원**: `/_next/webpack-hmr` 엔드포인트로 Hot Module Replacement 활성화
- **CORS 허용**: 모든 오리진(`*`)에서 API 접근 가능
- **SSL 없음**: HTTP만 사용하여 인증서 불필요

## 프로덕션 환경 특이사항

- **별도 서브도메인**: API는 `api.yourdomain.com`으로 분리
- **CORS 제한**: 특정 도메인만 허용
- **Rate limiting**: API 요청 제한 (10req/s)
- **보안 헤더**: HSTS, X-Frame-Options 등 적용
