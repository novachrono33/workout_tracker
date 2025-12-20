from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging

from app.database import get_db
from app.schemas import ResponseModel
from app.services.analytics_service import AnalyticsService
from app.dependencies import get_current_active_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/workout/{workout_id}")
def get_workout_analytics(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Аналитика конкретной тренировки"""
    try:
        logger.info(f"📊 Getting analytics for workout {workout_id}, user {current_user.id}")
        analytics_service = AnalyticsService(db)
        analytics = analytics_service.calculate_workout_analytics(workout_id)
        
        if not analytics:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        return ResponseModel(data=analytics, message="Workout analytics retrieved")
    except Exception as e:
        logger.error(f"❌ Error in get_workout_analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@router.get("/progress")
def get_user_progress(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Прогресс пользователя"""
    try:
        logger.info(f"📈 Getting progress for user {current_user.id}, days: {days}")
        analytics_service = AnalyticsService(db)
        progress = analytics_service.get_user_progress(current_user.id, days)
        
        return ResponseModel(data=progress, message="Progress analytics retrieved")
    except Exception as e:
        logger.error(f"❌ Error in get_user_progress: {e}")
        # Возвращаем пустой прогресс вместо ошибки
        empty_progress = {
            'period': f'{days} days',
            'total_workouts': 0,
            'total_volume_kg': 0,
            'avg_volume_per_workout': 0,
            'weekly_progress': [],
            'exercise_progress': {},
            'muscle_group_distribution': {},
            'consistency_score': 0,
            'strength_progress': {},
            'error': 'Analytics temporarily unavailable'
        }
        return ResponseModel(data=empty_progress, message="Progress retrieved with errors")

@router.get("/strength-progress")
def get_strength_progress(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Прогресс в силовых показателях"""
    try:
        logger.info(f"💪 Getting strength progress for user {current_user.id}")
        analytics_service = AnalyticsService(db)
        progress = analytics_service.get_user_progress(current_user.id, days)
        strength_data = progress.get('strength_progress', {})
        
        return ResponseModel(data=strength_data, message="Strength progress retrieved")
    except Exception as e:
        logger.error(f"❌ Error in get_strength_progress: {e}")
        return ResponseModel(data={}, message="Strength progress unavailable")

@router.post("/snapshot")
def create_analytics_snapshot(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Создание снимка аналитики"""
    try:
        logger.info(f"📸 Creating analytics snapshot for user {current_user.id}")
        analytics_service = AnalyticsService(db)
        snapshot = analytics_service.create_analytics_snapshot(current_user.id)
        
        return ResponseModel(data=snapshot, message="Analytics snapshot created")
    except Exception as e:
        logger.error(f"❌ Error in create_analytics_snapshot: {e}")
        raise HTTPException(status_code=500, detail=f"Snapshot error: {str(e)}")