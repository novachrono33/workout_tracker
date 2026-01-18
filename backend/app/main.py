# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import generate_latest
from starlette.responses import Response
import logging

from app.core.config import settings
from app.api import api_router
from app.database import engine
from app.models import base  # Base для create_all

# Metrics middleware (опционально)
try:
    from app.middleware.metrics import MetricsMiddleware
except ImportError:
    MetricsMiddleware = None
    logging.warning("⚠️ Metrics middleware not available")

# Redis клиент (опционально)
try:
    from app.core.redis import redis_client
except ImportError:
    redis_client = None
    logging.warning("⚠️ Redis not available")

# Логирование
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== СОЗДАНИЕ APP ====================
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    redirect_slashes=False,
)

# ==================== CORS MIDDLEWARE (ОБЯЗАТЕЛЬНО ПЕРВЫМ) ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # Grafana
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
)

# ==================== METRICS MIDDLEWARE ====================
if MetricsMiddleware:
    app.add_middleware(MetricsMiddleware)

# ==================== СОЗДАНИЕ ТАБЛИЦ ====================
base.Base.metadata.create_all(bind=engine)

# ==================== ROUTES ====================
@app.get("/")
def root():
    return {
        "message": "Workout Tracker API",
        "version": settings.VERSION,
        "metrics": "/metrics",
        "health": "/health"
    }

@app.get("/health")
def health_check():
    redis_status = "healthy" if redis_client and redis_client.is_connected() else "unhealthy"
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "healthy",
        "redis": redis_status
    }

@app.get("/metrics")
def metrics():
    return Response(content=generate_latest(), media_type="text/plain")

@app.get("/redis/stats")
def redis_stats():
    if not redis_client or not redis_client.is_connected():
        return {"status": "disconnected"}
    return {"status": "connected", "stats": redis_client.get_stats()}

app.include_router(api_router, prefix=settings.API_V1_STR)

# ==================== EVENTS ====================
@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info("📊 Metrics available at /metrics")
    logger.info("❤️ Health check at /health")
    if redis_client and redis_client.is_connected():
        logger.info("✅ Redis connected")
    else:
        logger.warning("⚠️ Redis not available")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")