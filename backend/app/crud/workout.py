from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_
from typing import List, Dict, Any, Optional
from app.crud.base import CRUDBase
from app.models.workout import Workout, WorkoutExercise, ExerciseSet
from app.models.exercise import Exercise
from app.schemas.workout import WorkoutCreate, WorkoutUpdate
import logging

logger = logging.getLogger(__name__)

class CRUDWorkout(CRUDBase[Workout, WorkoutCreate, WorkoutUpdate]):
    def get_multi_by_user(
        self, db: Session, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Workout]:
        workouts = (
            db.query(self.model)
            .filter(Workout.user_id == user_id)
            .options(
                selectinload(Workout.exercises).selectinload(WorkoutExercise.sets)
            )
            .order_by(Workout.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Подгружаем упражнения для всех WorkoutExercise одним запросом
        self._load_exercises_for_workouts(db, workouts)
        
        # Вычисляем объем для каждой тренировки
        for workout in workouts:
            workout.total_volume = self._calculate_total_volume(workout)
        
        return workouts
    
    def get_multi(
        self, db: Session, skip: int = 0, limit: int = 100
    ) -> List[Workout]:
        workouts = db.query(self.model).offset(skip).limit(limit).all()
        self._load_exercises_for_workouts(db, workouts)
        
        # Вычисляем объем для каждой тренировки
        for workout in workouts:
            workout.total_volume = self._calculate_total_volume(workout)
            
        return workouts
    
    def _load_exercises_for_workouts(self, db: Session, workouts: List[Workout]):
        """Подгружает упражнения для всех WorkoutExercise одним запросом"""
        if not workouts:
            return
            
        # Собираем все exercise_id
        exercise_ids = set()
        for workout in workouts:
            for workout_exercise in workout.exercises:
                exercise_ids.add(workout_exercise.exercise_id)
        
        if not exercise_ids:
            return
            
        # Загружаем все упражнения одним запросом
        exercises = db.query(Exercise).filter(Exercise.id.in_(exercise_ids)).all()
        exercises_map = {ex.id: ex for ex in exercises}
        
        # Распределяем упражнения по WorkoutExercise
        for workout in workouts:
            for workout_exercise in workout.exercises:
                workout_exercise.exercise = exercises_map.get(workout_exercise.exercise_id)
    
    def _calculate_total_volume(self, workout: Workout) -> float:
        """Вычисляет общий объем тренировки (вес * повторения)"""
        total_volume = 0.0
        for exercise in workout.exercises:
            for set_obj in exercise.sets:
                # Явно преобразуем Decimal в float
                weight = float(set_obj.weight_kg) if set_obj.weight_kg is not None else 0.0
                reps = int(set_obj.reps) if set_obj.reps is not None else 0
                total_volume += weight * reps
        return round(total_volume, 2)
    
    def create_with_exercises(self, db: Session, obj_in: WorkoutCreate, user_id: int) -> Workout:
        exercises_data = obj_in.exercises
        workout_data = obj_in.dict(exclude={'exercises'})
        
        db_obj = Workout(**workout_data, user_id=user_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        for exercise_data in exercises_data:
            workout_exercise = WorkoutExercise(
                workout_id=db_obj.id,
                exercise_id=exercise_data.exercise_id,
                order=exercise_data.order,
                target_rir=float(exercise_data.target_rir) if exercise_data.target_rir else None
            )
            db.add(workout_exercise)
            db.commit()
            db.refresh(workout_exercise)
            
            for set_data in exercise_data.sets:
                exercise_set = ExerciseSet(
                    workout_exercise_id=workout_exercise.id,
                    set_number=set_data.set_number,
                    weight_kg=float(set_data.weight_kg) if set_data.weight_kg else None,
                    reps=set_data.reps,
                    rir=float(set_data.rir) if set_data.rir else None,
                    rpe=float(set_data.rpe) if set_data.rpe else None
                )
                db.add(exercise_set)
        
        db.commit()
        # Перезагружаем с подгруженными упражнениями
        workout_with_exercises = self.get_with_exercises(db, db_obj.id)
        return workout_with_exercises

    def get_with_exercises(self, db: Session, id: int) -> Optional[Workout]:
        workout = (
            db.query(Workout)
            .options(
                selectinload(Workout.exercises).selectinload(WorkoutExercise.sets)
            )
            .filter(Workout.id == id)
            .first()
        )
        
        if workout:
            self._load_exercises_for_workouts(db, [workout])
            # Вычисляем объем тренировки
            workout.total_volume = self._calculate_total_volume(workout)
        
        return workout

    def add_exercise(self, db: Session, workout_id: int, exercise_in: Any) -> Optional[Workout]:
        workout = self.get(db, id=workout_id)
        if not workout:
            return None
            
        # Находим максимальный порядок
        max_order = max([ex.order for ex in workout.exercises]) if workout.exercises else 0
        
        workout_exercise = WorkoutExercise(
            workout_id=workout_id,
            exercise_id=exercise_in.exercise_id,
            order=max_order + 1,
            target_rir=float(exercise_in.target_rir) if exercise_in.target_rir else None
        )
        
        db.add(workout_exercise)
        db.commit()
        db.refresh(workout_exercise)
        
        # Добавляем стандартные подходы
        for i in range(3):
            exercise_set = ExerciseSet(
                workout_exercise_id=workout_exercise.id,
                set_number=i + 1,
                weight_kg=0.0,
                reps=10,
                rir=2.0
            )
            db.add(exercise_set)
        
        db.commit()
        # Перезагружаем с подгруженными упражнениями
        return self.get_with_exercises(db, workout_id)

    def update_exercise_order(self, db: Session, workout_id: int, exercise_id: int, new_order: int) -> bool:
        workout_exercise = db.query(WorkoutExercise).filter(
            WorkoutExercise.workout_id == workout_id,
            WorkoutExercise.id == exercise_id
        ).first()
        
        if not workout_exercise:
            return False
            
        workout_exercise.order = new_order
        db.commit()
        return True

    def update_with_exercises(self, db: Session, db_obj: Workout, obj_in: WorkoutUpdate) -> Workout:
        logger.info(f"Updating workout {db_obj.id}")
        
        # Обновляем основные поля тренировки
        update_data = obj_in.dict(exclude_unset=True, exclude={'exercises'})
        
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Если есть упражнения, обновляем их
        if hasattr(obj_in, 'exercises') and obj_in.exercises is not None:
            logger.info(f"Processing {len(obj_in.exercises)} exercises")
            
            # Удаляем старые упражнения и подходы
            db.query(ExerciseSet).filter(
                ExerciseSet.workout_exercise_id.in_(
                    db.query(WorkoutExercise.id).filter(WorkoutExercise.workout_id == db_obj.id)
                )
            ).delete(synchronize_session=False)
            
            db.query(WorkoutExercise).filter(WorkoutExercise.workout_id == db_obj.id).delete()
            
            # Добавляем новые упражнения
            for i, exercise_data in enumerate(obj_in.exercises):
                workout_exercise = WorkoutExercise(
                    workout_id=db_obj.id,
                    exercise_id=exercise_data.exercise_id,
                    order=exercise_data.order,
                    target_rir=float(exercise_data.target_rir) if exercise_data.target_rir else None
                )
                db.add(workout_exercise)
                db.flush()
                
                # Добавляем подходы
                for set_data in exercise_data.sets:
                    exercise_set = ExerciseSet(
                        workout_exercise_id=workout_exercise.id,
                        set_number=set_data.set_number,
                        weight_kg=float(set_data.weight_kg) if set_data.weight_kg else None,
                        reps=set_data.reps,
                        rir=float(set_data.rir) if set_data.rir else None,
                        rpe=float(set_data.rpe) if set_data.rpe else None
                    )
                    db.add(exercise_set)
            
            db.commit()
            logger.info("Workout updated successfully")
        
        # Перезагружаем обновленную тренировку
        updated_workout = self.get_with_exercises(db, db_obj.id)
        logger.info(f"Final workout state: {len(updated_workout.exercises)} exercises")
        return updated_workout

workout = CRUDWorkout(Workout)