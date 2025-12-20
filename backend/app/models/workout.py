from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base
import enum

class TrainingGoal(enum.Enum):
    HYPERTROPHY = "hypertrophy"
    STRENGTH = "strength"
    ENDURANCE = "endurance"

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, server_default=func.now())
    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    total_volume = Column(Numeric(10, 2), nullable=True)
    training_goal = Column(String, default=TrainingGoal.HYPERTROPHY.value)
    
    exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")
    user = relationship("User")

class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    target_rir = Column(Numeric(3, 1), nullable=True)
    
    workout = relationship("Workout", back_populates="exercises")
    sets = relationship("ExerciseSet", back_populates="workout_exercise", cascade="all, delete-orphan")
    
    # Динамическое свойство для доступа к упражнению
    @property
    def exercise(self):
        return getattr(self, '_exercise', None)
    
    @exercise.setter
    def exercise(self, value):
        self._exercise = value

class ExerciseSet(Base):
    __tablename__ = "exercise_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    weight_kg = Column(Numeric(6, 2), nullable=True)
    reps = Column(Integer, nullable=True)
    rir = Column(Numeric(3, 1), nullable=True)
    rpe = Column(Numeric(3, 1), nullable=True)
    # Убрали completed поле
    
    workout_exercise = relationship("WorkoutExercise", back_populates="sets")