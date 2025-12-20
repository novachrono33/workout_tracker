from typing import Optional, Dict
from pydantic import BaseModel, Field

class ExerciseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    muscle_coefficients: Optional[Dict[str, float]] = None

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    muscle_coefficients: Optional[Dict[str, float]] = None

class Exercise(ExerciseBase):
    id: int

    class Config:
        from_attributes = True