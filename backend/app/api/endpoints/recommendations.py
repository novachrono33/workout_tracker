# backend/app/api/endpoints/recommendations.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import logging

from app.database import get_db
from app.schemas import ResponseModel
from app.dependencies import get_current_user
from app.services.recommendation_service import RecommendationService
from app.models.user import User  # Импортируем модель

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/exercise/{exercise_id}", response_model=ResponseModel[Dict[str, Any]])
async def get_exercise_recommendation(
    exercise_id: int,
    current_sets: List[Dict[str, Any]] = Body(
        default=[],
        example=[
            {"set_number": 1, "weight_kg": 80, "reps": 8, "rir": 2.0},
            {"set_number": 2, "weight_kg": 80, "reps": 7, "rir": 1.5}
        ]
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Изменяем тип аннотации
):
    """
    Получить AI-рекомендацию для упражнения
    
    - **exercise_id**: ID упражнения
    - **current_sets**: Текущие подходы (опционально)
    """
    try:
        user_id = current_user.id  # Доступ через атрибут, а не как к словарю
        logger.info(f"Запрос рекомендации для пользователя {user_id}, упражнение {exercise_id}")
        
        recommendation_service = RecommendationService(db)
        recommendation = await recommendation_service.get_exercise_recommendation(
            user_id=user_id,
            exercise_id=exercise_id,
            current_sets=current_sets
        )
        
        if not recommendation.get("success", False):
            return ResponseModel(
                success=False,
                message=recommendation.get("message", "Ошибка получения рекомендации"),
                data=recommendation
            )
        
        return ResponseModel(
            success=True,
            data=recommendation,
            message="Рекомендация успешно получена"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Ошибка получения рекомендации: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )