# backend\app\schemas\template.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TemplateExerciseBase(BaseModel):
    exercise_id: int
    order: int
    default_sets: int = 3
    default_reps: int = 10
    default_rir: float = 2.0
    rest_seconds: int = 90
    notes: Optional[str] = None

class TemplateExerciseCreate(TemplateExerciseBase):
    pass

class TemplateExercise(TemplateExerciseBase):
    id: int
    exercise: "Exercise"
    
    class Config:
        from_attributes = True

class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    category: Optional[str] = None
    estimated_duration: Optional[int] = None
    tags: List[str] = []

class WorkoutTemplateCreate(WorkoutTemplateBase):
    exercises: List[TemplateExerciseCreate] = []

class WorkoutTemplateUpdate(WorkoutTemplateBase):
    name: Optional[str] = None

class WorkoutTemplate(WorkoutTemplateBase):
    id: int
    user_id: int
    exercises: List[TemplateExercise] = []
    
    class Config:
        from_attributes = True

# Для обновления отношений
from app.schemas.exercise import Exercise
TemplateExercise.update_forward_refs()