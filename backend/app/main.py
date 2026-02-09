from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import products, orders, users, suppliers, cart, payments, admin
from app.core.config import settings
from app.db.session import engine
from app.db import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.config import ensure_production_secret
    ensure_production_secret()
    print("🚀 KonaMall API Starting...")
    yield
    # Shutdown
    print("👋 KonaMall API Shutting down...")

app = FastAPI(
    title="KonaMall API",
    description="글로벌 드롭쉬핑 커머스 플랫폼 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products.router, prefix="/api", tags=["Products"])
app.include_router(orders.router, prefix="/api", tags=["Orders"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(suppliers.router, prefix="/api", tags=["Suppliers"])
app.include_router(cart.router, prefix="/api", tags=["Cart"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])


@app.get("/")
async def root():
    return {"message": "🛍️ Welcome to KonaMall API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
