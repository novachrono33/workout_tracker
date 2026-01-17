# backend/app/middleware/metrics.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import logging
from app.core.metrics import (
    http_requests_total,
    http_request_duration_seconds,
    http_request_size_bytes,
    http_response_size_bytes,
    errors_total
)

logger = logging.getLogger(__name__)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware для сбора метрик HTTP запросов"""
    
    async def dispatch(self, request: Request, call_next):
        # Пропускаем метрики endpoint
        if request.url.path == "/metrics":
            return await call_next(request)
        
        # Извлекаем информацию о запросе
        method = request.method
        path = request.url.path
        
        # Получаем размер запроса
        request_size = int(request.headers.get("content-length", 0))
        
        # Засекаем время начала
        start_time = time.time()
        
        # Обрабатываем запрос
        try:
            response: Response = await call_next(request)
            status_code = response.status_code
            
            # Получаем размер ответа
            response_size = int(response.headers.get("content-length", 0))
            
            # Записываем метрики
            duration = time.time() - start_time
            
            # HTTP метрики
            http_requests_total.labels(
                method=method,
                endpoint=path,
                status=str(status_code)
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=path
            ).observe(duration)
            
            http_request_size_bytes.labels(
                method=method,
                endpoint=path
            ).observe(request_size)
            
            http_response_size_bytes.labels(
                method=method,
                endpoint=path
            ).observe(response_size)
            
            # Логируем медленные запросы
            if duration > 1.0:
                logger.warning(
                    f"Slow request: {method} {path} took {duration:.2f}s"
                )
            
            # Записываем ошибки
            if status_code >= 400:
                errors_total.labels(
                    error_type=f"http_{status_code}",
                    endpoint=path
                ).inc()
            
            return response
            
        except Exception as e:
            # Записываем метрику ошибки
            duration = time.time() - start_time
            
            errors_total.labels(
                error_type="exception",
                endpoint=path
            ).inc()
            
            http_requests_total.labels(
                method=method,
                endpoint=path,
                status="500"
            ).inc()
            
            logger.error(f"Request failed: {method} {path} - {str(e)}")
            raise