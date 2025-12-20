import redis
from app.core.config import settings

redis_client = None

def get_redis():
    """
    Получение подключения к Redis.
    Использует синглтон-паттерн для одного подключения на всё приложение.
    """
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True,  # Автоматически декодирует bytes в строки
            socket_connect_timeout=5,
            retry_on_timeout=True
        )
        # Тестируем подключение
        try:
            redis_client.ping()
        except redis.ConnectionError:
            redis_client = None
            raise
    return redis_client