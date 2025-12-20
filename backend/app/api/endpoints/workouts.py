from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.schemas.workout import Workout, WorkoutCreate, WorkoutUpdate, WorkoutExerciseCreate
from app.schemas import ResponseModel
from app.crud.workout import workout as crud_workout

from app.dependencies import get_current_active_user
from app.schemas.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=ResponseModel[List[Workout]])
def read_workouts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение списка тренировок пользователя"""
    try:
        logger.info(f"📋 Getting workouts for user {current_user.id}, skip: {skip}, limit: {limit}")
        workouts = crud_workout.get_multi_by_user(
            db, user_id=current_user.id, skip=skip, limit=limit
        )
        logger.info(f"✅ Found {len(workouts)} workouts for user {current_user.id}")
        return ResponseModel(data=workouts, message="Workouts retrieved successfully")
    except Exception as e:
        logger.error(f"❌ Error in read_workouts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch workouts: {str(e)}")

@router.post("", response_model=ResponseModel[Workout])
def create_workout(
    workout_in: WorkoutCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Создание тренировки с упражнениями и подходами"""
    try:
        logger.info(f"🆕 Creating workout for user {current_user.id}")
        workout = crud_workout.create_with_exercises(db, obj_in=workout_in, user_id=current_user.id)
        logger.info(f"✅ Workout created with ID: {workout.id}")
        return ResponseModel(data=workout, message="Workout created successfully")
    except Exception as e:
        logger.error(f"❌ Error in create_workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create workout: {str(e)}")

@router.get("/{workout_id}", response_model=ResponseModel[Workout])
def read_workout(
    workout_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Получение конкретной тренировки"""
    try:
        logger.info(f"📖 Getting workout {workout_id} for user {current_user.id}")
        workout = crud_workout.get_with_exercises(db, id=workout_id)
        if not workout:
            logger.warning(f"⚠️ Workout {workout_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Workout not found")
        
        logger.info(f"✅ Workout {workout_id} found with {len(workout.exercises)} exercises")
        return ResponseModel(data=workout)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in read_workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch workout: {str(e)}")

@router.put("/{workout_id}", response_model=ResponseModel[Workout])
def update_workout(
    workout_id: int,
    workout_in: WorkoutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Обновление тренировки"""
    try:
        logger.info(f"🔧 UPDATE WORKOUT CALLED: workout_id={workout_id}, user_id={current_user.id}")
        logger.info(f"📦 Received data: {workout_in}")
        
        workout = crud_workout.get(db, id=workout_id)
        if not workout or workout.user_id != current_user.id:
            logger.warning(f"❌ Workout not found or access denied: {workout_id} for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Workout not found")
        
        logger.info(f"✅ Workout found: {workout.name}")
        
        # Используем метод для обновления с упражнениями
        workout = crud_workout.update_with_exercises(db, db_obj=workout, obj_in=workout_in)
        logger.info(f"🔄 After update_with_exercises")
        
        # Перезагружаем тренировку с упражнениями
        workout_with_exercises = crud_workout.get_with_exercises(db, id=workout_id)
        logger.info(f"📊 Final workout state: {len(workout_with_exercises.exercises)} exercises")
        
        return ResponseModel(data=workout_with_exercises, message="Workout updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in update_workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update workout: {str(e)}")

@router.delete("/{workout_id}")
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Удаление тренировки"""
    try:
        logger.info(f"🗑️ Deleting workout {workout_id} for user {current_user.id}")
        workout = crud_workout.get(db, id=workout_id)
        if not workout or workout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        crud_workout.remove(db, id=workout_id)
        logger.info(f"✅ Workout {workout_id} deleted")
        return ResponseModel(data=None, message="Workout deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in delete_workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete workout: {str(e)}")

@router.post("/{workout_id}/exercises", response_model=ResponseModel[Workout])
def add_exercise_to_workout(
    workout_id: int, 
    exercise_in: WorkoutExerciseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Добавление упражнения в тренировку (для Drag & Drop)"""
    try:
        logger.info(f"➕ Adding exercise to workout {workout_id}")
        workout = crud_workout.add_exercise(db, workout_id=workout_id, exercise_in=exercise_in)
        if not workout or workout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Workout not found")
        return ResponseModel(data=workout, message="Exercise added to workout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in add_exercise_to_workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add exercise: {str(e)}")

@router.put("/{workout_id}/exercises/{exercise_id}/order")
def update_exercise_order(
    workout_id: int,
    exercise_id: int, 
    new_order: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Обновление порядка упражнений (после Drag & Drop)"""
    try:
        logger.info(f"🔀 Updating exercise order: workout={workout_id}, exercise={exercise_id}, order={new_order}")
        workout = crud_workout.get(db, id=workout_id)
        if not workout or workout.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Workout not found")
            
        success = crud_workout.update_exercise_order(db, workout_id, exercise_id, new_order)
        if not success:
            raise HTTPException(status_code=404, detail="Exercise not found in workout")
        return ResponseModel(message="Exercise order updated")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in update_exercise_order: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update exercise order: {str(e)}")