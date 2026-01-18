# backend/app/core/redis.py
from fastapi import Depends, HTTPException
import redis
import logging
from typing import Optional, Any
import json
import time

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client wrapper с поддержкой метрик (lazy import)"""
    
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.client: Optional[redis.Redis] = None
        self._connect()
    
    def _connect(self):
        """Подключение к Redis"""
        try:
            self.client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                max_connections=50
            )
            self.client.ping()
            logger.info("✅ Redis connected successfully")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.ping()
            return True
        except:
            return False
    
    def get(self, key: str, cache_type: str = "default") -> Optional[Any]:
        # Lazy import метрик
        from app.core.metrics import cache_hits_total, cache_misses_total, cache_operation_duration_seconds
        
        if not self.is_connected():
            cache_misses_total.labels(cache_type=cache_type).inc()
            return None
        
        start_time = time.time()
        try:
            value = self.client.get(key)
            duration = time.time() - start_time
            
            cache_operation_duration_seconds.labels(
                operation="get",
                cache_type=cache_type
            ).observe(duration)
            
            if value is not None:
                cache_hits_total.labels(cache_type=cache_type).inc()
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            else:
                cache_misses_total.labels(cache_type=cache_type).inc()
                return None
                
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            cache_misses_total.labels(cache_type=cache_type).inc()
            return None
    
    def set(
        self, 
        key: str, 
        value: Any, 
        expire: int = 3600,
        cache_type: str = "default"
    ) -> bool:
        from app.core.metrics import cache_operation_duration_seconds
        
        if not self.is_connected():
            return False
        
        start_time = time.time()
        try:
            if not isinstance(value, str):
                value = json.dumps(value)
            
            result = self.client.setex(key, expire, value)
            duration = time.time() - start_time
            
            cache_operation_duration_seconds.labels(
                operation="set",
                cache_type=cache_type
            ).observe(duration)
            
            return bool(result)
            
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str, cache_type: str = "default") -> bool:
        from app.core.metrics import cache_operation_duration_seconds
        
        if not self.is_connected():
            return False
        
        start_time = time.time()
        try:
            result = self.client.delete(key)
            duration = time.time() - start_time
            
            cache_operation_duration_seconds.labels(
                operation="delete",
                cache_type=cache_type
            ).observe(duration)
            
            return bool(result)
            
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        if not self.is_connected():
            return False
        
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        if not self.is_connected():
            return 0
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis clear_pattern error: {e}")
            return 0
    
    def get_stats(self) -> dict:
        if not self.is_connected():
            return {}
        
        try:
            info = self.client.info()
            return {
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "total_commands_processed": info.get("total_commands_processed"),
                "keyspace_hits": info.get("keyspace_hits"),
                "keyspace_misses": info.get("keyspace_misses"),
                "uptime_in_seconds": info.get("uptime_in_seconds")
            }
        except Exception as e:
            logger.error(f"Redis stats error: {e}")
            return {}


# Singleton instance
redis_client = RedisClient()

# =============== ПРАВИЛЬНАЯ DEPENDENCY (синхронная) ===============
def get_redis() -> redis.Redis:
    """
    FastAPI dependency для получения синхронного Redis-клиента.
    НЕ async и НЕ yield — клиент синхронный.
    """
    if not redis_client.is_connected():
        redis_client._connect()
    
    if redis_client.client is None:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    
    return redis_client.client