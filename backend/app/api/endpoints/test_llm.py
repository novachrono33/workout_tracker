from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.llm_service import LLMService
from app.schemas import ResponseModel

router = APIRouter()

@router.get("/test-llm")
def test_llm(db: Session = Depends(get_db)):
    """Тестовый endpoint для проверки работы LLM"""
    
    llm_service = LLMService()
    
    # Тестовые данные
    test_data = {
        "exercise_history": [
            {
                "date": "2024-01-15",
                "sets": [
                    {"total_weight": 55, "reps": 10, "rir": 2, "completed": True},
                    {"total_weight": 55, "reps": 10, "rir": 2, "completed": True},
                    {"total_weight": 55, "reps": 9, "rir": 1, "completed": True}
                ]
            }
        ],
        "current_workout": {
            "sets": [
                {"total_weight": 60, "reps": 10, "rir": 2, "completed": True},
                {"total_weight": 60, "reps": 10, "rir": 2, "completed": True},
                {"total_weight": 60, "reps": 9, "rir": 1, "completed": True}
            ]
        },
        "user_goal": "hypertrophy",
        "exercise": {
            "name": "Жим штанги лежа", 
            "muscle_group": "грудь",
            "optimal_reps_min": 8,
            "optimal_reps_max": 12
        },
        "equipment": {
            "name": "Штанга",
            "base_weight": 20,
            "min_increment": 2.5,
            "available_weights": [1.25, 2.5, 5, 10, 15, 20]
        }
    }
    
    try:
        recommendation = llm_service.get_training_recommendation(
            user_profile={"goal": "hypertrophy", "experience_level": "intermediate"},
            exercise_context=test_data
        )
        
        return {
            "status": "success",
            "llm_used": recommendation.get("source", "unknown"),
            "recommendation": recommendation,
            "test_data": test_data
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "test_data": test_data
        }