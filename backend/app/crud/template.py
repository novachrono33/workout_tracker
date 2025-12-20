# backend/app/crud/template.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.crud.base import CRUDBase
from app.models.template import WorkoutTemplate, TemplateExercise
from app.schemas.template import WorkoutTemplateCreate, WorkoutTemplateUpdate

class CRUDWorkoutTemplate(CRUDBase[WorkoutTemplate, WorkoutTemplateCreate, WorkoutTemplateUpdate]):
    def create_with_exercises(self, db: Session, obj_in: WorkoutTemplateCreate, user_id: int) -> WorkoutTemplate:
        exercises_data = obj_in.exercises
        template_data = obj_in.dict(exclude={'exercises'})
        
        db_obj = WorkoutTemplate(**template_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        for exercise_data in exercises_data:
            exercise_obj = TemplateExercise(**exercise_data.dict(), template_id=db_obj.id)
            db.add(exercise_obj)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[WorkoutTemplate]:
        return db.query(WorkoutTemplate).filter(WorkoutTemplate.user_id == user_id).offset(skip).limit(limit).all()

    def get_public_templates(self, db: Session, skip: int = 0, limit: int = 100) -> List[WorkoutTemplate]:
        return db.query(WorkoutTemplate).filter(WorkoutTemplate.is_public == True).offset(skip).limit(limit).all()

    def create_workout_from_template(self, db: Session, template_id: int, user_id: int) -> Dict[str, Any]:
        """Создание тренировки из шаблона"""
        from app.models.workout import Workout, WorkoutExercise, ExerciseSet
        from app.schemas.workout import WorkoutCreate
        
        template = self.get(db, id=template_id)
        if not template:
            return {"error": "Template not found"}
        
        # Создаем тренировку
        workout = Workout(
            name=f"{template.name} - {datetime.now().strftime('%Y-%m-%d')}",
            user_id=user_id,
            notes=f"Created from template: {template.description}"
        )
        db.add(workout)
        db.commit()
        db.refresh(workout)
        
        # Добавляем упражнения из шаблона
        for template_exercise in template.exercises:
            workout_exercise = WorkoutExercise(
                workout_id=workout.id,
                exercise_id=template_exercise.exercise_id,
                order=template_exercise.order,
                notes=template_exercise.notes,
                target_rir=template_exercise.default_rir
            )
            db.add(workout_exercise)
            db.commit()
            db.refresh(workout_exercise)
            
            # Создаем подходы
            for set_number in range(1, template_exercise.default_sets + 1):
                exercise_set = ExerciseSet(
                    workout_exercise_id=workout_exercise.id,
                    set_number=set_number,
                    plate_weight_kg=0,  # Начальный вес
                    reps=template_exercise.default_reps,
                    rir=template_exercise.default_rir,
                    completed=False
                )
                db.add(exercise_set)
        
        db.commit()
        db.refresh(workout)
        
        return {
            "workout": workout,
            "message": f"Workout created from template '{template.name}'"
        }

workout_template = CRUDWorkoutTemplate(WorkoutTemplate)