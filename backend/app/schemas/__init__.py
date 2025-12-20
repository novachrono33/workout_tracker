from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any

T = TypeVar('T')

class ResponseModel(BaseModel, Generic[T]):
    data: T
    message: str = ""
    success: bool = True

class ErrorResponseModel(BaseModel):
    message: str
    success: bool = False
    error_code: Optional[str] = None

# Реэкспортируем все схемы
from .exercise import Exercise, ExerciseCreate, ExerciseUpdate
from .user import User, UserCreate, UserUpdate, Token
from .workout import Workout, WorkoutCreate, WorkoutUpdate, WorkoutExercise, WorkoutExerciseCreate, ExerciseSet, ExerciseSetCreate, TrainingGoal
from .template import WorkoutTemplate, WorkoutTemplateCreate, WorkoutTemplateUpdate, TemplateExercise, TemplateExerciseCreate

__all__ = [
    "ResponseModel",
    "ErrorResponseModel",
    "Exercise",
    "ExerciseCreate",
    "ExerciseUpdate",
    "User",
    "UserCreate",
    "UserUpdate",
    "Token",
    "Workout",
    "WorkoutCreate",
    "WorkoutUpdate",
    "WorkoutExercise",
    "WorkoutExerciseCreate",
    "ExerciseSet",
    "ExerciseSetCreate",
    "TrainingGoal",
    "WorkoutTemplate",
    "WorkoutTemplateCreate",
    "WorkoutTemplateUpdate",
    "TemplateExercise",
    "TemplateExerciseCreate",
]