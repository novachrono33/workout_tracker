from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import enum

class TrainingGoal(str, enum.Enum):
    HYPERTROPHY = "hypertrophy"
    STRENGTH = "strength"
    ENDURANCE = "endurance"

class ExerciseSetBase(BaseModel):
    set_number: int
    weight_kg: Optional[float] = Field(None, ge=0, le=5000)
    reps: Optional[int] = Field(None, ge=0, le=100)
    rir: Optional[float] = Field(None, ge=0, le=10)
    rpe: Optional[float] = Field(None, ge=0, le=10)

    @validator('weight_kg', pre=True, always=True)
    def validate_weight(cls, v):
        if v is None:
            return v
        return round(float(v), 2) if v is not None else v

    @validator('rir', 'rpe', pre=True, always=True)
    def validate_rir_rpe(cls, v):
        if v is None:
            return v
        return round(float(v), 1) if v is not None else v

class ExerciseSetCreate(ExerciseSetBase):
    pass

class ExerciseSet(ExerciseSetBase):
    id: int
    
    class Config:
        from_attributes = True

class WorkoutExerciseBase(BaseModel):
    exercise_id: int
    order: int
    # Убрали notes для упражнений, так как они не используются в интерфейсе
    target_rir: Optional[float] = Field(None, ge=0, le=10)

class WorkoutExerciseCreate(WorkoutExerciseBase):
    sets: List[ExerciseSetCreate] = []

class WorkoutExercise(WorkoutExerciseBase):
    id: int
    exercise: "Exercise"
    sets: List[ExerciseSet] = []
    
    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)  # Ограничение 5000 символов для тренировки
    duration_minutes: Optional[int] = Field(None, ge=0, le=1440)  # Макс 24 часа
    training_goal: TrainingGoal = TrainingGoal.HYPERTROPHY

class WorkoutCreate(WorkoutBase):
    exercises: List[WorkoutExerciseCreate] = []

class WorkoutUpdate(WorkoutBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    training_goal: Optional[TrainingGoal] = None
    exercises: Optional[List[WorkoutExerciseCreate]] = None

    class Config:
        from_attributes = True

class Workout(WorkoutBase):
    id: int
    user_id: int
    date: datetime
    total_volume: Optional[float] = None
    exercises: List[WorkoutExercise] = []
    
    class Config:
        from_attributes = True

# Для обновления отношений
from .exercise import Exercise
WorkoutExercise.update_forward_refs()