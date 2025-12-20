from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json

from app.models.workout import Workout, WorkoutExercise, ExerciseSet
from app.models.user import User
from app.models.exercise import Exercise

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_workout_analytics(self, workout_id: int) -> Dict[str, Any]:
        """Расчет аналитики для конкретной тренировки"""
        workout = self.db.query(Workout).filter(Workout.id == workout_id).first()
        if not workout:
            return {}
        
        exercises_data = []
        muscle_volume = defaultdict(float)
        total_volume = 0
        total_sets = 0
        total_reps = 0
        
        for workout_exercise in workout.exercises:
            # ВРЕМЕННО: используем primary_muscle вместо muscle_group
            muscle_group = getattr(workout_exercise.exercise, 'primary_muscle', 'Unknown')
            
            exercise_data = {
                'exercise_name': workout_exercise.exercise.name,
                'muscle_group': muscle_group,
                'sets': [],
                'volume': 0,
                'max_weight': 0
            }
            
            for set in workout_exercise.sets:
                # Убрали проверку completed, так как мы убрали это поле
                if set.weight_kg and set.reps:
                    set_volume = set.weight_kg * set.reps
                    exercise_data['volume'] += set_volume
                    exercise_data['max_weight'] = max(exercise_data['max_weight'], set.weight_kg)
                    exercise_data['sets'].append({
                        'set_number': set.set_number,
                        'weight': set.weight_kg,
                        'reps': set.reps,
                        'volume': set_volume
                    })
                    
                    total_volume += set_volume
                    total_sets += 1
                    total_reps += set.reps
                    muscle_volume[muscle_group] += set_volume
            
            exercises_data.append(exercise_data)
        
        return {
            'workout_id': workout_id,
            'date': workout.date,
            'total_volume': total_volume,
            'total_sets': total_sets,
            'total_reps': total_reps,
            'exercises': exercises_data,
            'muscle_group_volume': dict(muscle_volume),
            'intensity_score': self._calculate_intensity_score(exercises_data)
        }

    def get_user_progress(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Прогресс пользователя за указанный период"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            workouts = (self.db.query(Workout)
                       .filter(Workout.user_id == user_id)
                       .filter(Workout.date >= start_date)
                       .filter(Workout.date <= end_date)
                       .order_by(Workout.date)
                       .all())
            
            if not workouts:
                return {
                    'period': f'{days} days',
                    'total_workouts': 0,
                    'total_volume_kg': 0,
                    'avg_volume_per_workout': 0,
                    'weekly_progress': [],
                    'exercise_progress': {},
                    'muscle_group_distribution': {},
                    'consistency_score': 0,
                    'strength_progress': {}
                }
            
            # Основные метрики
            total_volume = sum(w.total_volume or 0 for w in workouts)
            total_workouts = len(workouts)
            avg_volume_per_workout = total_volume / total_workouts if total_workouts > 0 else 0
            
            # Прогресс по неделям
            weekly_progress = self._get_weekly_progress(workouts)
            
            # Прогресс по упражнениям
            exercise_progress = self._get_exercise_progress(user_id, start_date, end_date)
            
            # Распределение по мышечным группам
            muscle_distribution = self._get_muscle_group_distribution(workouts)
            
            return {
                'period': f'{days} days',
                'total_workouts': total_workouts,
                'total_volume_kg': total_volume,
                'avg_volume_per_workout': avg_volume_per_workout,
                'weekly_progress': weekly_progress,
                'exercise_progress': exercise_progress,
                'muscle_group_distribution': muscle_distribution,
                'consistency_score': self._calculate_consistency_score(workouts),
                'strength_progress': self._calculate_strength_progress(user_id, start_date, end_date)
            }
        except Exception as e:
            print(f"❌ Error in get_user_progress: {e}")
            return {
                'period': f'{days} days',
                'total_workouts': 0,
                'total_volume_kg': 0,
                'avg_volume_per_workout': 0,
                'weekly_progress': [],
                'exercise_progress': {},
                'muscle_group_distribution': {},
                'consistency_score': 0,
                'strength_progress': {},
                'error': str(e)
            }

    def _get_weekly_progress(self, workouts: List[Workout]) -> List[Dict]:
        """Прогресс по неделям"""
        weekly_data = defaultdict(lambda: {'volume': 0, 'workouts': 0})
        
        for workout in workouts:
            week_key = workout.date.strftime('%Y-%U')
            weekly_data[week_key]['volume'] += workout.total_volume or 0
            weekly_data[week_key]['workouts'] += 1
        
        return [
            {
                'week': week,
                'volume': data['volume'],
                'workouts': data['workouts'],
                'avg_volume_per_workout': data['volume'] / data['workouts'] if data['workouts'] > 0 else 0
            }
            for week, data in sorted(weekly_data.items())
        ]

    def _get_exercise_progress(self, user_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Прогресс по конкретным упражнениям"""
        try:
            exercises = (self.db.query(Exercise)
                        .join(WorkoutExercise)
                        .join(Workout)
                        .filter(Workout.user_id == user_id)
                        .filter(Workout.date >= start_date)
                        .filter(Workout.date <= end_date)
                        .distinct()
                        .all())
            
            exercise_progress = {}
            
            for exercise in exercises:
                # Находим максимальный вес и объем для этого упражнения
                max_weight_query = (self.db.query(func.max(ExerciseSet.weight_kg))
                                  .join(WorkoutExercise)
                                  .join(Workout)
                                  .filter(Workout.user_id == user_id)
                                  .filter(WorkoutExercise.exercise_id == exercise.id)
                                  .filter(Workout.date >= start_date)
                                  .filter(Workout.date <= end_date)
                                  .scalar())
                
                total_volume_query = (self.db.query(func.sum(ExerciseSet.weight_kg * ExerciseSet.reps))
                                    .join(WorkoutExercise)
                                    .join(Workout)
                                    .filter(Workout.user_id == user_id)
                                    .filter(WorkoutExercise.exercise_id == exercise.id)
                                    .filter(Workout.date >= start_date)
                                    .filter(Workout.date <= end_date)
                                    .scalar())
                
                exercise_progress[exercise.name] = {
                    'max_weight': max_weight_query or 0,
                    'total_volume': total_volume_query or 0,
                    # ВРЕМЕННО убрали muscle_group
                    # 'muscle_group': exercise.muscle_group
                }
            
            return exercise_progress
        except Exception as e:
            print(f"❌ Error in _get_exercise_progress: {e}")
            return {}

    def _get_muscle_group_distribution(self, workouts: List[Workout]) -> Dict[str, float]:
        """Распределение нагрузки по мышечным группам"""
        try:
            muscle_volume = defaultdict(float)
            total_volume = 0
            
            for workout in workouts:
                for exercise in workout.exercises:
                    # ВРЕМЕННО: используем primary_muscle
                    muscle_group = getattr(exercise.exercise, 'primary_muscle', None)
                    if muscle_group:
                        exercise_volume = sum(
                            set.weight_kg * set.reps 
                            for set in exercise.sets 
                            if set.weight_kg and set.reps  # Убрали completed
                        )
                        muscle_volume[muscle_group] += exercise_volume
                        total_volume += exercise_volume
            
            if total_volume > 0:
                return {muscle: (volume / total_volume) * 100 for muscle, volume in muscle_volume.items()}
            return {}
        except Exception as e:
            print(f"❌ Error in _get_muscle_group_distribution: {e}")
            return {}

    def _calculate_intensity_score(self, exercises_data: List[Dict]) -> float:
        """Расчет оценки интенсивности тренировки"""
        if not exercises_data:
            return 0
        
        total_rpe_volume = 0
        total_volume = 0
        
        for exercise in exercises_data:
            for set_data in exercise.get('sets', []):
                # Упрощенный расчет интенсивности на основе объема и веса
                intensity = set_data.get('weight', 0) * 0.4 + set_data.get('reps', 0) * 0.1
                total_rpe_volume += intensity * set_data.get('volume', 0)
                total_volume += set_data.get('volume', 0)
        
        return (total_rpe_volume / total_volume) if total_volume > 0 else 0

    def _calculate_consistency_score(self, workouts: List[Workout]) -> float:
        """Оценка консистентности тренировок"""
        if len(workouts) < 2:
            return 0
        
        dates = [w.date for w in workouts]
        dates.sort()
        
        # Рассчитываем средний интервал между тренировками
        intervals = []
        for i in range(1, len(dates)):
            interval = (dates[i] - dates[i-1]).days
            intervals.append(interval)
        
        avg_interval = sum(intervals) / len(intervals)
        
        # Оценка основана на стабильности интервалов
        if avg_interval == 0:
            return 100
        
        consistency = max(0, 100 - (sum(abs(i - avg_interval) for i in intervals) / len(intervals)) * 10)
        return min(100, consistency)

    def _calculate_strength_progress(self, user_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Прогресс в силе (1ПМ estimation)"""
        try:
            # Находим основные силовые упражнения
            strength_exercises = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press']
            
            progress = {}
            for exercise_name in strength_exercises:
                exercise = self.db.query(Exercise).filter(Exercise.name == exercise_name).first()
                if not exercise:
                    continue
                
                # Находим лучший подход за период
                best_set = (self.db.query(ExerciseSet)
                           .join(WorkoutExercise)
                           .join(Workout)
                           .filter(Workout.user_id == user_id)
                           .filter(WorkoutExercise.exercise_id == exercise.id)
                           .filter(Workout.date >= start_date)
                           .filter(Workout.date <= end_date)
                           .order_by(ExerciseSet.weight_kg.desc())
                           .first())
                
                if best_set and best_set.weight_kg and best_set.reps:
                    estimated_1rm = self._estimate_1rm(best_set.weight_kg, best_set.reps)
                    progress[exercise_name] = {
                        'best_weight': best_set.weight_kg,
                        'best_reps': best_set.reps,
                        'estimated_1rm': estimated_1rm,
                        'date': best_set.workout_exercise.workout.date
                    }
            
            return progress
        except Exception as e:
            print(f"❌ Error in _calculate_strength_progress: {e}")
            return {}

    def _estimate_1rm(self, weight: float, reps: int) -> float:
        """Оценка 1ПМ по формуле Бжицки"""
        if reps <= 1:
            return weight
        return weight * (36 / (37 - reps))

    def create_analytics_snapshot(self, user_id: int):
        """Создание снимка аналитики для пользователя"""
        progress = self.get_user_progress(user_id, days=30)
        return progress