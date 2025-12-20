from sqlalchemy import Column, Boolean, Integer, String, ForeignKey, Text, JSON, Float
from sqlalchemy.orm import relationship
from .base import Base

class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    category = Column(String(50))
    estimated_duration = Column(Integer)
    tags = Column(JSON)
    
    user = relationship("User")
    exercises = relationship("TemplateExercise", back_populates="template", cascade="all, delete-orphan")

class TemplateExercise(Base):
    __tablename__ = "template_exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    order = Column(Integer)
    
    default_sets = Column(Integer, default=3)
    default_reps = Column(Integer, default=10)
    default_rir = Column(Float, default=2.0)
    rest_seconds = Column(Integer, default=90)
    notes = Column(Text)
    
    template = relationship("WorkoutTemplate", back_populates="exercises")
    # Убираем relationship к Exercise - он нам не нужен!