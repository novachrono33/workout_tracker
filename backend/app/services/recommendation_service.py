# backend/app/services/recommendation_service.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from app.models.workout import Workout, WorkoutExercise, ExerciseSet
from app.models.user import User
from app.models.exercise import Exercise
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_service = LLMService()
    
    async def get_exercise_recommendation(
        self, 
        user_id: int, 
        exercise_id: int,
        current_sets: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Получение рекомендаций для упражнения
        """
        
        logger.info(f"🔄 Начинаю получение рекомендации для user_id={user_id}, exercise_id={exercise_id}")
        
        try:
            # Получаем пользователя
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"❌ Пользователь с ID {user_id} не найден")
                return {
                    "success": False,
                    "message": f"Пользователь с ID {user_id} не найден"
                }
            
            logger.debug(f"Найден пользователь: {user.id}, цель тренировки: {user.training_goal}")
            
            # Получаем историю тренировок за последний месяц
            history = self._get_exercise_history(user_id, exercise_id, days=30)
            logger.debug(f"Получено {len(history)} исторических тренировок")
            
            # Получаем информацию об упражнении
            exercise_info = self._get_exercise_info(exercise_id)
            logger.debug(f"Информация об упражнении: {exercise_info.get('name')}")
            
            # Проверяем: если нет истории И нет текущих подходов - просим добавить подход
            if not history and (not current_sets or len(current_sets) == 0):
                logger.info(f"⚠️ Нет данных для рекомендации: история пуста и нет текущих подходов")
                return {
                    "success": False,
                    "requires_initial_set": True,
                    "message": "Для получения рекомендации сначала выполните хотя бы один подход с вашим рабочим весом."
                }
            
            # Формируем данные для LLM - ТОЛЬКО ТЕ ПОЛЯ, КОТОРЫЕ РЕАЛЬНО СУЩЕСТВУЮТ
            workout_data = {
                "user_profile": {
                    "training_goal": user.training_goal or "гипертрофия",
                    # Убираем несуществующие поля: experience_level, age, gender
                },
                "exercise_info": exercise_info,
                "recent_workouts": history,
                "current_sets": current_sets or []
            }
            
            logger.info(f"📊 Данные для LLM подготовлены: {len(current_sets or [])} текущих подходов")
            
            # Получаем рекомендацию от LLM
            try:
                recommendation = await self.llm_service.get_training_recommendation(workout_data)
                logger.info("✅ Рекомендация получена от LLM")
            except Exception as e:
                logger.error(f"❌ Ошибка при получении рекомендации от LLM: {str(e)}")
                return {
                    "success": False,
                    "message": f"Ошибка при получении рекомендации от ИИ: {str(e)}"
                }
            
            # Форматируем ответ для фронтенда
            response = self._format_recommendation_response(recommendation, exercise_info, current_sets or [])
            
            if response.get("success"):
                logger.info(f"✅ Рекомендация успешно сформирована: {len(response.get('sets_array', []))} подходов")
            else:
                logger.warning(f"⚠️ Рекомендация не сформирована: {response.get('message')}")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Необработанная ошибка при получении рекомендации: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Внутренняя ошибка сервера: {str(e)}"
            }
    
    def _get_exercise_history(
        self, 
        user_id: int, 
        exercise_id: int, 
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Получение истории тренировок по упражнению за последние N дней"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        logger.debug(f"Получение истории за {days} дней, cutoff_date: {cutoff_date}")
        
        try:
            workouts = (self.db.query(Workout)
                       .filter(Workout.user_id == user_id)
                       .filter(Workout.date >= cutoff_date)
                       .join(WorkoutExercise)
                       .filter(WorkoutExercise.exercise_id == exercise_id)
                       .order_by(Workout.date.desc())
                       .limit(3)
                       .all())
            
            history = []
            for workout in workouts:
                workout_exercise = (self.db.query(WorkoutExercise)
                                   .filter(WorkoutExercise.workout_id == workout.id)
                                   .filter(WorkoutExercise.exercise_id == exercise_id)
                                   .first())
                
                if workout_exercise:
                    sets = (self.db.query(ExerciseSet)
                            .filter(ExerciseSet.workout_exercise_id == workout_exercise.id)
                            .order_by(ExerciseSet.set_number)
                            .all())
                    
                    if sets:
                        history.append({
                            "date": workout.date.isoformat() if workout.date else None,
                            "sets": [
                                {
                                    "set_number": s.set_number,
                                    "weight_kg": float(s.weight_kg) if s.weight_kg else 0,
                                    "reps": s.reps,
                                    "rir": float(s.rir) if s.rir else None
                                }
                                for s in sets
                            ]
                        })
            
            logger.debug(f"Найдено {len(history)} исторических тренировок")
            return history
            
        except Exception as e:
            logger.error(f"Ошибка при получении истории тренировок: {str(e)}", exc_info=True)
            return []
    
    def _get_exercise_info(self, exercise_id: int) -> Dict[str, Any]:
        """Получение информации об упражнении"""
        try:
            exercise = (self.db.query(Exercise)
                        .filter(Exercise.id == exercise_id)
                        .first())
            
            if not exercise:
                logger.warning(f"Упражнение с ID {exercise_id} не найдено")
                return {"name": f"Упражнение #{exercise_id}", "muscle_group": "unknown"}
            
            muscle_group = getattr(exercise, 'muscle_group', None)
            if not muscle_group:
                muscle_group = getattr(exercise, 'primary_muscle', 
                              getattr(exercise, 'target_muscle', 'unknown'))
            
            info = {
                "id": exercise.id,
                "name": exercise.name,
                "muscle_group": muscle_group
            }
            
            logger.debug(f"Информация об упражнении получена: {info}")
            return info
            
        except Exception as e:
            logger.error(f"Ошибка при получении информации об упражнении: {str(e)}")
            return {"name": f"Упражнение #{exercise_id}", "muscle_group": "unknown"}
    
    def _format_recommendation_response(
        self, 
        llm_response: Dict[str, Any],
        exercise_info: Dict[str, Any],
        current_sets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Форматирует ответ LLM для фронтенда"""
        
        logger.debug("Форматирую ответ от LLM")
        
        try:
            if not isinstance(llm_response, dict):
                logger.error("Неверный формат ответа от LLM: не словарь")
                return {
                    "success": False,
                    "message": "Неверный формат ответа от ИИ"
                }
            
            recommendations = llm_response.get("recommendations", [])
            
            if not recommendations or not isinstance(recommendations, list):
                logger.warning("Пустой список рекомендаций от LLM")
                return {
                    "success": False,
                    "message": "ИИ не предоставил рекомендаций",
                    "llm_metadata": llm_response.get("llm_metadata", {})
                }
            
            first_rec = recommendations[0] if len(recommendations) > 0 else {}
            
            if not isinstance(first_rec, dict):
                logger.error("Неверный формат первой рекомендации")
                return {
                    "success": False,
                    "message": "Неверный формат рекомендации",
                    "llm_metadata": llm_response.get("llm_metadata", {})
                }
            
            sets_array = first_rec.get("sets_array", [])
            if not isinstance(sets_array, list):
                logger.warning("sets_array не является списком")
                sets_array = []
            
            if not sets_array:
                logger.info("ИИ рекомендует не добавлять подходы (пустой sets_array)")
                return {
                    "success": True,
                    "message": "Рекомендуется закончить упражнение, не добавляя подходов",
                    "sets_array": [],
                    "llm_metadata": llm_response.get("llm_metadata", {})
                }
            
            # Корректируем номера подходов
            current_sets_count = len(current_sets)
            corrected_sets_array = []
            
            logger.debug(f"Корректирую номера подходов. Текущих подходов: {current_sets_count}")
            
            for i, set_data in enumerate(sets_array):
                if not isinstance(set_data, dict):
                    logger.warning(f"Подход {i} не является словарем, пропускаю")
                    continue
                
                corrected_set = dict(set_data)
                corrected_set['set_number'] = current_sets_count + i + 1
                corrected_sets_array.append(corrected_set)
                logger.debug(f"Подход {i}: {corrected_set}")
            
            response = {
                "success": True,
                "exercise_name": first_rec.get("exercise_name", exercise_info.get("name")),
                "sets_array": corrected_sets_array,
                "is_addition": True,
                "llm_metadata": llm_response.get("llm_metadata", {})
            }
            
            logger.info(f"✅ Ответ сформирован: {len(corrected_sets_array)} рекомендуемых подходов")
            return response
            
        except Exception as e:
            logger.error(f"❌ Ошибка при форматировании ответа: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Ошибка обработки рекомендации: {str(e)}"
            }