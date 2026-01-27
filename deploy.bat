@echo off
REM KonaMall 배포 스크립트 (Windows)
REM 사용법: deploy.bat [environment]
REM 환경: dev (기본값) 또는 prod

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo ========================================
echo   KonaMall Deployment Script
echo   Environment: %ENVIRONMENT%
echo ========================================

if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="prod" (
    echo Error: Invalid environment. Use 'dev' or 'prod'
    exit /b 1
)

REM .env 파일 확인
if "%ENVIRONMENT%"=="prod" (
    if not exist ".env.production" (
        echo Error: .env.production file not found
        echo Please copy .env.production.example to .env.production and configure it
        exit /b 1
    )
    set ENV_FILE=.env.production
    set COMPOSE_FILE=docker-compose.prod.yml
) else (
    set ENV_FILE=.env
    set COMPOSE_FILE=docker-compose.yml
)

echo Step 1: Checking Docker and Docker Compose...
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo Error: Docker Compose is not installed
        exit /b 1
    )
)

echo [OK] Docker and Docker Compose are available

echo Step 2: Pulling latest changes from Git...
if exist ".git" (
    git pull origin main 2>nul || echo Warning: Could not pull from Git
) else (
    echo Warning: Not a Git repository
)

echo Step 3: Building Docker images...
docker-compose -f %COMPOSE_FILE% build --no-cache

echo Step 4: Stopping existing containers...
docker-compose -f %COMPOSE_FILE% down

echo Step 5: Starting containers...
docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up -d

echo Step 6: Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo Step 7: Running database migrations...
docker-compose -f %COMPOSE_FILE% exec -T backend alembic upgrade head || echo Warning: Migration failed

echo Step 8: Checking service status...
docker-compose -f %COMPOSE_FILE% ps

echo ========================================
echo   Deployment completed successfully!
echo ========================================

if "%ENVIRONMENT%"=="dev" (
    echo Frontend: http://localhost:3000
    echo Backend API: http://localhost:8000
    echo API Docs: http://localhost:8000/docs
) else (
    echo Please check your domain configuration
    echo Frontend: https://yourdomain.com
    echo Backend API: https://api.yourdomain.com
)

echo.
echo Useful commands:
echo   View logs:    docker-compose -f %COMPOSE_FILE% logs -f
echo   Stop:         docker-compose -f %COMPOSE_FILE% down
echo   Restart:      docker-compose -f %COMPOSE_FILE% restart
echo   Shell:        docker-compose -f %COMPOSE_FILE% exec backend bash

endlocal
