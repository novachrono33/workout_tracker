# backend/app/middleware/__init__.py
from .metrics import MetricsMiddleware

__all__ = ['MetricsMiddleware']