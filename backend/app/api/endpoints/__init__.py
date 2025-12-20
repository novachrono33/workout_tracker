from .exercises import router as exercises_router
from .workouts import router as workouts_router
from .recommendations import router as recommendations_router
from .auth import router as auth_router
from .users import router as users_router
from .analytics import router as analytics_router
from .templates import router as templates_router
from .test_llm import router as test_llm_router

__all__ = [
    "exercises_router",
    "workouts_router",
    "recommendations_router",
    "auth_router",
    "users_router",
    "analytics_router",
    "templates_router",
    "test_llm_router"
]