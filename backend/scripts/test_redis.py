import redis
import json

# Тестируем подключение к Redis
client = redis.Redis(host="localhost", port=6379, db=0)

try:
    # Тест ping
    print("Testing Redis connection...")
    response = client.ping()
    print(f"Redis ping response: {response}")
    
    # Тест записи/чтения
    test_key = "test:key"
    test_value = {"hello": "world", "number": 42}
    
    client.set(test_key, json.dumps(test_value))
    retrieved = json.loads(client.get(test_key))
    print(f"Set and retrieved: {retrieved}")
    
    # Очистка тестового ключа
    client.delete(test_key)
    
    print("Redis connection successful!")
    
except redis.ConnectionError as e:
    print(f"Failed to connect to Redis: {e}")
except Exception as e:
    print(f"Error: {e}")