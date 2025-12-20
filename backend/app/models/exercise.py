from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    muscle_coefficients = Column(JSONB, nullable=True)