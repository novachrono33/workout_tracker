import json
import redis
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

from app.database import get_db
from app.schemas import ResponseModel, Exercise, ExerciseCreate, ExerciseUpdate
from app.crud.exercise import exercise as crud_exercise
from app.dependencies import get_current_active_user, get_redis
from app.schemas.user import User

router = APIRouter()

@router.get("", response_model=ResponseModel[List[Exercise]])
def read_exercises(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """
    Получение списка упражнений с кэшированием в Redis.
    Кэшируется навсегда, инвалидируется при изменениях.
    """
    cache_key = "exercises:list:all"
    
    try:
        # 1. Пытаемся получить из кэша
        cached_data = redis_client.get(cache_key)
        if cached_data:
            all_exercises = json.loads(cached_data)
            # Применяем пагинацию к закэшированным данным
            paginated_exercises = all_exercises[skip:skip + limit]
            return ResponseModel(
                data=paginated_exercises,
                message="Exercises retrieved from cache"
            )
    except (json.JSONDecodeError, redis.RedisError) as e:
        # Если ошибка чтения кэша - просто продолжаем с БД
        print(f"Redis cache error, falling back to DB: {e}")

    # 2. Если нет в кэше или ошибка - запрашиваем из БД
    all_exercises = crud_exercise.get_multi(db, skip=0, limit=10000)  # Большой лимит для всех
    
    # 3. Кэшируем ВСЕ упражнения (для пагинации)
    try:
        # Используем jsonable_encoder для корректной сериализации SQLAlchemy моделей
        exercises_data = jsonable_encoder(all_exercises)
        redis_client.set(cache_key, json.dumps(exercises_data))
        print("Exercises cached successfully")
    except (TypeError, redis.RedisError) as e:
        print(f"Failed to cache exercises: {e}")

    # 4. Применяем пагинацию и возвращаем
    paginated_exercises = all_exercises[skip:skip + limit]
    return ResponseModel(
        data=paginated_exercises,
        message="Exercises retrieved from database"
    )

@router.post("", response_model=ResponseModel[Exercise])
def create_exercise(
    exercise_in: ExerciseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """Создание упражнения с инвалидацией кэша"""
    # Проверяем, существует ли упражнение с таким именем
    existing_exercise = crud_exercise.get_by_name(db, name=exercise_in.name)
    if existing_exercise:
        raise HTTPException(
            status_code=400,
            detail="Exercise with this name already exists"
        )
    
    exercise = crud_exercise.create(db, obj_in=exercise_in)
    
    # ИНВАЛИДАЦИЯ КЭША: удаляем кэшированный список упражнений
    try:
        redis_client.delete("exercises:list:all")
        print("Cache invalidated after creating exercise")
    except redis.RedisError as e:
        print(f"Failed to invalidate cache: {e}")
    
    return ResponseModel(data=exercise, message="Exercise created successfully")

@router.get("/{exercise_id}", response_model=ResponseModel[Exercise])
def read_exercise(
    exercise_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение одного упражнения (без кэширования, т.к. редко используется)"""
    exercise = crud_exercise.get(db, id=exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ResponseModel(data=exercise)

@router.put("/{exercise_id}", response_model=ResponseModel[Exercise])
def update_exercise(
    exercise_id: int,
    exercise_in: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """Обновление упражнения с инвалидацией кэша"""
    exercise = crud_exercise.get(db, id=exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Проверяем уникальность имени, если оно изменено
    if exercise_in.name and exercise_in.name != exercise.name:
        existing_exercise = crud_exercise.get_by_name(db, name=exercise_in.name)
        if existing_exercise and existing_exercise.id != exercise_id:
            raise HTTPException(
                status_code=400,
                detail="Exercise with this name already exists"
            )
    
    exercise = crud_exercise.update(db, db_obj=exercise, obj_in=exercise_in)
    
    # ИНВАЛИДАЦИЯ КЭША
    try:
        redis_client.delete("exercises:list:all")
        print("Cache invalidated after updating exercise")
    except redis.RedisError as e:
        print(f"Failed to invalidate cache: {e}")
    
    return ResponseModel(data=exercise, message="Exercise updated successfully")

@router.delete("/{exercise_id}")
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """Удаление упражнения с инвалидацией кэша"""
    exercise = crud_exercise.get(db, id=exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    crud_exercise.remove(db, id=exercise_id)
    
    # ИНВАЛИДАЦИЯ КЭША
    try:
        redis_client.delete("exercises:list:all")
        print("Cache invalidated after deleting exercise")
    except redis.RedisError as e:
        print(f"Failed to invalidate cache: {e}")
    
    return ResponseModel(data=None, message="Exercise deleted successfully")

@router.get("/muscle-group/{muscle_group}", response_model=ResponseModel[List[Exercise]])
def read_exercises_by_muscle_group(
    muscle_group: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """Получение упражнений по мышечной группе с кэшированием"""
    cache_key = f"exercises:muscle_group:{muscle_group.lower()}"
    
    try:
        # Проверяем кэш
        cached_data = redis_client.get(cache_key)
        if cached_data:
            exercises = json.loads(cached_data)
            return ResponseModel(
                data=exercises[skip:skip + limit],
                message=f"Exercises for {muscle_group} retrieved from cache"
            )
    except (json.JSONDecodeError, redis.RedisError) as e:
        print(f"Redis cache error for muscle group: {e}")

    # Запрашиваем из БД
    exercises = crud_exercise.get_by_muscle_group(db, muscle_group=muscle_group)
    
    # Кэшируем
    try:
        exercises_data = jsonable_encoder(exercises)
        redis_client.set(cache_key, json.dumps(exercises_data))
    except (TypeError, redis.RedisError) as e:
        print(f"Failed to cache muscle group exercises: {e}")

    return ResponseModel(
        data=exercises[skip:skip + limit],
        message=f"Exercises for {muscle_group} retrieved"
    )

@router.patch("/{exercise_id}", response_model=ResponseModel[Exercise])
def partial_update_exercise(
    exercise_id: int,
    exercise_in: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    redis_client = Depends(get_redis)
):
    """Частичное обновление упражнения с инвалидацией кэша"""
    exercise = crud_exercise.get(db, id=exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Проверяем уникальность имени только если оно передано
    if exercise_in.name is not None:
        if exercise_in.name != exercise.name:
            existing_exercise = crud_exercise.get_by_name(db, name=exercise_in.name)
            if existing_exercise and existing_exercise.id != exercise_id:
                raise HTTPException(
                    status_code=400,
                    detail="Exercise with this name already exists"
                )
    
    # Обновляем только переданные поля
    update_data = exercise_in.dict(exclude_unset=True)
    
    if not update_data:
        return ResponseModel(data=exercise, message="No changes provided")
    
    exercise = crud_exercise.update(db, db_obj=exercise, obj_in=update_data)
    
    # ИНВАЛИДАЦИЯ КЭША
    try:
        redis_client.delete("exercises:list:all")
        # Также инвалидируем кэш по мышечной группе, если она изменилась
        if "muscle_group" in update_data:
            redis_client.delete(f"exercises:muscle_group:{exercise.muscle_group.lower()}")
        print("Cache invalidated after partial update")
    except redis.RedisError as e:
        print(f"Failed to invalidate cache: {e}")
    
    return ResponseModel(data=exercise, message="Exercise updated successfully")