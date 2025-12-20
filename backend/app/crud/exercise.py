from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from sqlalchemy import Float

from app.crud.base import CRUDBase
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate

class CRUDExercise(CRUDBase[Exercise, ExerciseCreate, ExerciseUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Exercise]:
        return db.query(Exercise).filter(Exercise.name == name).first()

    def get_by_muscle_group(self, db: Session, *, muscle_group: str) -> List[Exercise]:
        return (
            db.query(Exercise)
            .filter(Exercise.muscle_coefficients.has_key(muscle_group))
            .filter(Exercise.muscle_coefficients[muscle_group].astext.cast(Float) > 0)
            .all()
        )

exercise = CRUDExercise(Exercise)