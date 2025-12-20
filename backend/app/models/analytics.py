# backend/app/models/analytics.py
"""
Аналитические модели: хранение снимков/резюме тренировки/расчётов.
ВНИМАНИЕ: здесь НЕ должно быть определения таблицы 'workouts'.
Класс Workout хранится в backend/app/models/workout.py
"""

from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, Text, JSON, String
from sqlalchemy.orm import relationship

# Импорт единственного Base для всех моделей в проекте.
# В вашем проекте base объявлен в backend/app/models/base.py:
#     from sqlalchemy.ext.declarative import declarative_base
#     Base = declarative_base()
from app.models.base import Base  # noqa: E402

class AnalyticsSnapshot(Base):
    """
    Снимок аналитики: общий контейнер для произвольных расчётов/результатов,
    которые генерирует сервис (например LLM-рекомендации, агрегаты по объёму и т.п.)
    """
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    # payload можно хранить как JSON или как Text — зависит от БД и требований.
    # Если Postgres поддерживает JSON, лучше JSON; если не уверены — Text.
    payload_json = Column(JSON, nullable=True)
    tag = Column(String(128), nullable=True, index=True)
    notes = Column(Text, nullable=True)

    # если нужно связать снимок с конкретной тренировкой:
    # workout_id = Column(Integer, ForeignKey("workouts.id", ondelete="CASCADE"), nullable=True)
    # workout = relationship("Workout", back_populates="analytics_snapshots")
