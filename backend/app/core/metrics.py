# backend/app/middleware/metrics.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.metrics import (
    http_requests_total,
    http_request_duration_seconds,
    exceptions_total
)
import time

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Исключаем endpoints метрик и health, чтобы не зациклить счётчики
        if request.url.path in ("/metrics", "/health", "/favicon.ico", "/docs", "/openapi.json"):
            return await call_next(request)

        method = request.method
        path = request.url.path

        # Считаем запрос
        http_requests_total.labels(method=method, endpoint=path, status="processing").inc()

        start_time = time.time()

        try:
            response = await call_next(request)
            duration = time.time() - start_time
            status_code = response.status_code

            # Записываем успешный запрос
            http_requests_total.labels(method=method, endpoint=path, status=str(status_code)).inc()
            http_request_duration_seconds.labels(method=method, endpoint=path).observe(duration)

            return response

        except Exception as e:
            duration = time.time() - start_time
            exception_type = type(e).__name__

            # Записываем ошибку
            http_requests_total.labels(method=method, endpoint=path, status="500").inc()
            http_request_duration_seconds.labels(method=method, endpoint=path).observe(duration)
            exceptions_total.labels(exception_type=exception_type).inc()

            raise e