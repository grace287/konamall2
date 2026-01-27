#!/bin/bash

# KonaMall 배포 스크립트
# 사용법: ./deploy.sh [environment]
# 환경: dev (기본값) 또는 prod

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  KonaMall Deployment Script${NC}"
echo -e "${GREEN}  Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}"

# 환경 확인
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo -e "${RED}Error: Invalid environment. Use 'dev' or 'prod'${NC}"
    exit 1
fi

# .env 파일 확인
if [ "$ENVIRONMENT" = "prod" ]; then
    if [ ! -f "$SCRIPT_DIR/.env.production" ]; then
        echo -e "${RED}Error: .env.production file not found${NC}"
        echo -e "${YELLOW}Please copy .env.production.example to .env.production and configure it${NC}"
        exit 1
    fi
    ENV_FILE=".env.production"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    ENV_FILE=".env"
    COMPOSE_FILE="docker-compose.yml"
fi

echo -e "${YELLOW}Step 1: Checking Docker and Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are available${NC}"

echo -e "${YELLOW}Step 2: Pulling latest changes from Git...${NC}"
if [ -d "$SCRIPT_DIR/.git" ]; then
    git pull origin main || echo -e "${YELLOW}Warning: Could not pull from Git${NC}"
else
    echo -e "${YELLOW}Warning: Not a Git repository${NC}"
fi

echo -e "${YELLOW}Step 3: Building Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" build --no-cache

echo -e "${YELLOW}Step 4: Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down

echo -e "${YELLOW}Step 5: Starting containers...${NC}"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo -e "${YELLOW}Step 6: Waiting for services to be ready...${NC}"
sleep 10

echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head || echo -e "${YELLOW}Warning: Migration failed${NC}"

echo -e "${YELLOW}Step 8: Checking service status...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$ENVIRONMENT" = "dev" ]; then
    echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
    echo -e "${YELLOW}Backend API: http://localhost:8000${NC}"
    echo -e "${YELLOW}API Docs: http://localhost:8000/docs${NC}"
else
    echo -e "${YELLOW}Please check your domain configuration${NC}"
    echo -e "${YELLOW}Frontend: https://yourdomain.com${NC}"
    echo -e "${YELLOW}Backend API: https://api.yourdomain.com${NC}"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo -e "  Stop:         docker-compose -f $COMPOSE_FILE down"
echo -e "  Restart:      docker-compose -f $COMPOSE_FILE restart"
echo -e "  Shell:        docker-compose -f $COMPOSE_FILE exec backend bash"
