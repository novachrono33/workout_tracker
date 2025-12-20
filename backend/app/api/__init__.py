from fastapi import APIRouter
from app.api.endpoints import (
    exercises_router,
    workouts_router,
    recommendations_router,
    auth_router,
    users_router,
    analytics_router,
    templates_router,
    test_llm_router
)

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(exercises_router, prefix="/exercises", tags=["exercises"])
api_router.include_router(workouts_router, prefix="/workouts", tags=["workouts"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(templates_router, prefix="/templates", tags=["templates"])
api_router.include_router(test_llm_router, prefix="/test", tags=["testing"])