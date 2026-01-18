from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, extract, and_
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json
from decimal import Decimal

from app.models.workout import Workout, WorkoutExercise, ExerciseSet
from app.models.user import User
from app.models.exercise import Exercise

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def _safe_float(self, value) -> float:
        """Безопасное преобразование в float"""
        if value is None:
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def _parse_muscle_coefficients(self, muscle_coefficients) -> Dict[str, float]:
        """Парсинг коэффициентов мышечных групп"""
        try:
            if not muscle_coefficients:
                return {"Unknown": 1.0}
            
            # Если muscle_coefficients - это JSON строка, парсим ее
            if isinstance(muscle_coefficients, str):
                try:
                    coeffs = json.loads(muscle_coefficients)
                except json.JSONDecodeError:
                    return {"Unknown": 1.0}
            else:
                coeffs = muscle_coefficients
            
            # Если это словарь, нормализуем коэффициенты
            if isinstance(coeffs, dict):
                # Преобразуем все значения в float и фильтруем некорректные
                result = {}
                total = 0.0
                for muscle, coeff in coeffs.items():
                    try:
                        coeff_float = float(coeff)
                        if coeff_float > 0:
                            result[muscle] = coeff_float
                            total += coeff_float
                    except (ValueError, TypeError):
                        continue
                
                # Если все коэффициенты нулевые или некорректные
                if total == 0:
                    return {"Unknown": 1.0}
                
                # Нормализуем коэффициенты так, чтобы их сумма была 1
                return {muscle: coeff/total for muscle, coeff in result.items()}
            else:
                return {"Unknown": 1.0}
        except Exception as e:
            print(f"Error parsing muscle coefficients: {e}")
            return {"Unknown": 1.0}

    def _calculate_workout_volume(self, workout: Workout) -> float:
        """Расчет объема тренировки на основе сетов"""
        total_volume = 0.0
        for workout_exercise in workout.exercises:
            for set in workout_exercise.sets:
                weight = self._safe_float(set.weight_kg)
                reps = self._safe_float(set.reps)
                if weight > 0 and reps > 0:
                    total_volume += weight * reps
        return total_volume

    def calculate_workout_analytics(self, workout_id: int) -> Dict[str, Any]:
        """Расчет аналитики для конкретной тренировки"""
        workout = (self.db.query(Workout)
                  .filter(Workout.id == workout_id)
                  .first())
        
        if not workout:
            return {}
        
        # Загружаем связанные данные отдельными запросами
        exercises = (self.db.query(WorkoutExercise)
                    .filter(WorkoutExercise.workout_id == workout_id)
                    .options(selectinload(WorkoutExercise.sets))
                    .all())
        
        # Загружаем информацию об упражнениях
        exercise_ids = [ex.exercise_id for ex in exercises]
        exercise_info = (self.db.query(Exercise)
                        .filter(Exercise.id.in_(exercise_ids))
                        .all())
        exercise_map = {ex.id: ex for ex in exercise_info}
        
        exercises_data = []
        muscle_volume = defaultdict(float)
        total_volume = 0.0
        total_sets = 0
        total_reps = 0
        
        for workout_exercise in exercises:
            exercise = exercise_map.get(workout_exercise.exercise_id)
            if not exercise:
                continue
                
            # Парсим коэффициенты мышечных групп
            muscle_coefficients = self._parse_muscle_coefficients(
                exercise.muscle_coefficients
            )
            
            exercise_volume = 0.0
            exercise_max_weight = 0.0
            sets_data = []
            
            for set in workout_exercise.sets:
                weight = self._safe_float(set.weight_kg)
                reps = self._safe_float(set.reps)
                if weight > 0 and reps > 0:
                    set_volume = weight * reps
                    exercise_volume += set_volume
                    exercise_max_weight = max(exercise_max_weight, weight)
                    total_volume += set_volume
                    total_sets += 1
                    total_reps += int(reps) if reps else 0
                    
                    # Распределяем объем между мышцами согласно коэффициентам
                    for muscle, coeff in muscle_coefficients.items():
                        muscle_volume[muscle] += set_volume * coeff
                    
                    sets_data.append({
                        'set_number': set.set_number,
                        'weight': weight,
                        'reps': int(reps) if reps else 0,
                        'volume': set_volume
                    })
            
            exercises_data.append({
                'exercise_name': exercise.name,
                'muscle_coefficients': muscle_coefficients,
                'sets': sets_data,
                'volume': exercise_volume,
                'max_weight': exercise_max_weight
            })
        
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
            
            # Получаем тренировки за период
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
            
            # Получаем все workout_exercises для этих тренировок
            workout_ids = [w.id for w in workouts]
            workout_exercises = (self.db.query(WorkoutExercise)
                                .filter(WorkoutExercise.workout_id.in_(workout_ids))
                                .all())
            
            # Получаем все sets для этих workout_exercises
            workout_exercise_ids = [we.id for we in workout_exercises]
            all_sets = (self.db.query(ExerciseSet)
                       .filter(ExerciseSet.workout_exercise_id.in_(workout_exercise_ids))
                       .all())
            
            # Создаем мапы для быстрого доступа
            sets_by_workout_exercise = defaultdict(list)
            for set in all_sets:
                sets_by_workout_exercise[set.workout_exercise_id].append(set)
            
            workout_exercises_by_workout = defaultdict(list)
            for we in workout_exercises:
                we.sets = sets_by_workout_exercise.get(we.id, [])
                workout_exercises_by_workout[we.workout_id].append(we)
            
            # Получаем информацию об упражнениях
            exercise_ids = [we.exercise_id for we in workout_exercises]
            exercises = (self.db.query(Exercise)
                        .filter(Exercise.id.in_(exercise_ids))
                        .all())
            exercise_map = {ex.id: ex for ex in exercises}
            
            # Привязываем упражнения к workout_exercises
            for we in workout_exercises:
                we.exercise = exercise_map.get(we.exercise_id)
            
            # Привязываем workout_exercises к тренировкам
            for workout in workouts:
                workout.exercises = workout_exercises_by_workout.get(workout.id, [])
            
            # Основные метрики - рассчитываем на основе сетов
            total_volume = 0.0
            for workout in workouts:
                workout_volume = 0.0
                for we in workout.exercises:
                    for set in we.sets:
                        weight = self._safe_float(set.weight_kg)
                        reps = self._safe_float(set.reps)
                        if weight > 0 and reps > 0:
                            workout_volume += weight * reps
                total_volume += workout_volume
            
            total_workouts = len(workouts)
            avg_volume_per_workout = total_volume / total_workouts if total_workouts > 0 else 0
            
            # Прогресс по неделям
            weekly_progress = self._get_weekly_progress(workouts)
            
            # Распределение по мышечным группам
            muscle_distribution = self._get_muscle_group_distribution(workouts)
            
            # Прогресс по упражнениям
            exercise_progress = self._get_exercise_progress(user_id, start_date, end_date)
            
            return {
                'period': f'{days} days',
                'total_workouts': total_workouts,
                'total_volume_kg': round(total_volume, 2),
                'avg_volume_per_workout': round(avg_volume_per_workout, 2),
                'weekly_progress': weekly_progress,
                'exercise_progress': exercise_progress,
                'muscle_group_distribution': muscle_distribution,
                'consistency_score': self._calculate_consistency_score(workouts),
                'strength_progress': self._calculate_strength_progress(user_id, start_date, end_date)
            }
        except Exception as e:
            print(f"❌ Error in get_user_progress: {str(e)}")
            import traceback
            traceback.print_exc()
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
        weekly_data = defaultdict(lambda: {'volume': 0.0, 'workouts': 0})
        
        for workout in workouts:
            week_key = workout.date.strftime('%Y-%U')
            workout_volume = 0.0
            for we in workout.exercises:
                for set in we.sets:
                    weight = self._safe_float(set.weight_kg)
                    reps = self._safe_float(set.reps)
                    if weight > 0 and reps > 0:
                        workout_volume += weight * reps
            weekly_data[week_key]['volume'] += workout_volume
            weekly_data[week_key]['workouts'] += 1
        
        return [
            {
                'week': f"Week {week.split('-')[1]}",
                'volume': round(data['volume'], 2),
                'workouts': data['workouts'],
                'avg_volume_per_workout': round(data['volume'] / data['workouts'], 2) if data['workouts'] > 0 else 0
            }
            for week, data in sorted(weekly_data.items())
        ]

    def _get_exercise_progress(self, user_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Прогресс по конкретным упражнениям"""
        try:
            # Получаем все workout_exercises за период
            workout_exercises = (self.db.query(WorkoutExercise)
                                .join(Workout)
                                .filter(Workout.user_id == user_id)
                                .filter(Workout.date >= start_date)
                                .filter(Workout.date <= end_date)
                                .all())
            
            if not workout_exercises:
                return {}
            
            # Получаем все sets для этих workout_exercises
            workout_exercise_ids = [we.id for we in workout_exercises]
            all_sets = (self.db.query(ExerciseSet)
                       .filter(ExerciseSet.workout_exercise_id.in_(workout_exercise_ids))
                       .all())
            
            # Создаем мапу sets по workout_exercise_id
            sets_by_workout_exercise = defaultdict(list)
            for set in all_sets:
                sets_by_workout_exercise[set.workout_exercise_id].append(set)
            
            # Получаем информацию об упражнениях
            exercise_ids = [we.exercise_id for we in workout_exercises]
            exercises = (self.db.query(Exercise)
                        .filter(Exercise.id.in_(exercise_ids))
                        .all())
            exercise_map = {ex.id: ex for ex in exercises}
            
            exercise_data = {}
            
            for we in workout_exercises:
                exercise = exercise_map.get(we.exercise_id)
                if not exercise:
                    continue
                    
                exercise_name = exercise.name
                if exercise_name not in exercise_data:
                    exercise_data[exercise_name] = {
                        'total_volume': 0.0,
                        'max_weight': 0.0,
                        'total_sets': 0,
                        'workout_count': 0
                    }
                
                sets = sets_by_workout_exercise.get(we.id, [])
                exercise_volume = 0.0
                max_weight = 0.0
                
                for set in sets:
                    weight = self._safe_float(set.weight_kg)
                    reps = self._safe_float(set.reps)
                    if weight > 0 and reps > 0:
                        set_volume = weight * reps
                        exercise_volume += set_volume
                        max_weight = max(max_weight, weight)
                
                exercise_data[exercise_name]['total_volume'] += exercise_volume
                exercise_data[exercise_name]['max_weight'] = max(
                    exercise_data[exercise_name]['max_weight'], 
                    max_weight
                )
                exercise_data[exercise_name]['total_sets'] += len(sets)
                exercise_data[exercise_name]['workout_count'] += 1
            
            # Форматируем результат
            formatted_result = {}
            for ex_name, data in exercise_data.items():
                formatted_result[ex_name] = {
                    'max_weight': round(data['max_weight'], 2),
                    'total_volume': round(data['total_volume'], 2),
                    'workout_count': data['workout_count']
                }
            
            return formatted_result
        except Exception as e:
            print(f"❌ Error in _get_exercise_progress: {e}")
            return {}

    def _get_muscle_group_distribution(self, workouts: List[Workout]) -> Dict[str, float]:
        """Распределение нагрузки по мышечным группам"""
        try:
            muscle_volume = defaultdict(float)
            total_volume = 0.0
            
            for workout in workouts:
                for exercise in workout.exercises:
                    if not exercise.exercise:
                        continue
                    
                    # Парсим коэффициенты мышечных групп
                    muscle_coefficients = self._parse_muscle_coefficients(
                        exercise.exercise.muscle_coefficients
                    )
                    
                    exercise_volume = 0.0
                    for set in exercise.sets:
                        weight = self._safe_float(set.weight_kg)
                        reps = self._safe_float(set.reps)
                        if weight > 0 and reps > 0:
                            exercise_volume += weight * reps
                    
                    # Распределяем объем между мышцами согласно коэффициентам
                    for muscle, coeff in muscle_coefficients.items():
                        muscle_volume[muscle] += exercise_volume * coeff
                    
                    total_volume += exercise_volume
            
            if total_volume > 0:
                # Нормализуем до 100%
                distribution = {}
                for muscle, volume in muscle_volume.items():
                    percentage = (volume / total_volume) * 100
                    # Показываем все группы с долей более 0.1%
                    if percentage >= 0.1:
                        distribution[muscle] = round(percentage, 1)
                
                # Сортируем по убыванию процента
                return dict(sorted(distribution.items(), key=lambda x: x[1], reverse=True))
            return {}
        except Exception as e:
            print(f"❌ Error in _get_muscle_group_distribution: {e}")
            return {}

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
        
        # Идеальная консистентность - тренировки через равные промежутки
        if avg_interval == 0:
            return 100
        
        # Вычисляем отклонения от среднего интервала
        deviations = [abs(interval - avg_interval) for interval in intervals]
        avg_deviation = sum(deviations) / len(deviations) if deviations else 0
        
        # Оценка: чем меньше отклонения, тем выше консистентность
        # Максимум 100 при нулевом отклонении
        consistency = max(0, 100 - (avg_deviation / avg_interval) * 100)
        return round(min(100, consistency), 1)

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
                
                # Находим лучший подход за период с весом и повторениями
                best_set = (self.db.query(ExerciseSet)
                           .join(WorkoutExercise)
                           .join(Workout)
                           .filter(Workout.user_id == user_id)
                           .filter(WorkoutExercise.exercise_id == exercise.id)
                           .filter(Workout.date >= start_date)
                           .filter(Workout.date <= end_date)
                           .filter(ExerciseSet.weight_kg.isnot(None))
                           .filter(ExerciseSet.reps.isnot(None))
                           .order_by(ExerciseSet.weight_kg.desc())
                           .first())
                
                if best_set:
                    weight = self._safe_float(best_set.weight_kg)
                    reps = self._safe_float(best_set.reps)
                    estimated_1rm = self._estimate_1rm(weight, int(reps) if reps else 1)
                    progress[exercise_name] = {
                        'best_weight': round(weight, 2),
                        'best_reps': int(reps) if reps else 0,
                        'estimated_1rm': round(estimated_1rm, 2),
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
        # Исправленная формула: weight * (1 + reps/30)
        return weight * (1 + reps / 30)

    def create_analytics_snapshot(self, user_id: int):
        """Создание снимка аналитики для пользователя"""
        progress = self.get_user_progress(user_id, days=30)
        return progress