import requests
import json
import time
import re
from datetime import datetime, timedelta

def extract_json_from_response(text):
    """Извлекаем JSON из ответа, убирая markdown обертки"""
    json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if json_match:
        return json_match.group(1).strip()
    return text.strip()

def call_llm_api(system_prompt, user_prompt, model="Qwen2.5-1.5B-Instruct"):
    """Универсальная функция для вызова LLM API"""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 1500,
        "temperature": 0.1,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(
            "http://localhost:8001/v1/chat/completions",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            return True, content
        else:
            return False, f"HTTP Error {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, f"Request failed: {e}"

def analyze_recommendations_quality(recommendations, scenario_name, expected_conditions):
    """Анализируем качество и логику рекомендаций"""
    
    print(f"\n🔍 АНАЛИЗ СЦЕНАРИЯ: {scenario_name}")
    print("-" * 60)
    
    if not recommendations:
        print("❌ Не удалось получить рекомендации")
        return False
    
    # Проверяем базовую структуру
    required_keys = ["recommendations", "overall_volume_change", "training_focus", "recovery_notes"]
    missing_keys = [key for key in required_keys if key not in recommendations]
    
    if missing_keys:
        print(f"❌ Отсутствуют поля: {missing_keys}")
        return False
    
    print("✅ Базовая структура JSON корректна")
    
    # Проверяем рекомендации по упражнениям
    exercises = recommendations["recommendations"]
    if not exercises:
        print("❌ Нет рекомендаций по упражнениям")
        return False
    
    print(f"📊 Количество упражнений: {len(exercises)}")
    
    all_valid = True
    for i, exercise in enumerate(exercises, 1):
        print(f"\n🏋️‍♂️ Упражнение {i}: {exercise.get('exercise_name', 'N/A')}")
        
        # Проверяем обязательные поля
        required_exercise_fields = ["exercise_name", "sets", "reps", "weight_kg", "target_rir", "rationale", "progression_type"]
        for field in required_exercise_fields:
            if field not in exercise:
                print(f"   ❌ Отсутствует поле: {field}")
                all_valid = False
            else:
                print(f"   ✅ {field}: {exercise[field]}")
        
        # Проверяем логическую согласованность
        progression = exercise.get('progression_type')
        rationale = exercise.get('rationale', '')
        
        # Проверяем соответствие rationale и progression_type
        rationale_lower = rationale.lower()
        if progression == "increase_weight" and not any(word in rationale_lower for word in ["увелич", "повыш", "добав"]):
            print("   ⚠️  Обоснование не соответствует увеличению веса")
        elif progression == "decrease_weight" and not any(word in rationale_lower for word in ["уменьш", "сниж", "разгруз"]):
            print("   ⚠️  Обоснование не соответствует уменьшению веса")
        elif progression == "deload" and "разгруз" not in rationale_lower:
            print("   ⚠️  Обоснование не соответствует разгрузке")
    
    # Проверяем общие рекомендации
    print(f"\n📋 ОБЩИЕ РЕКОМЕНДАЦИИ:")
    volume_change = recommendations.get('overall_volume_change')
    training_focus = recommendations.get('training_focus')
    recovery_notes = recommendations.get('recovery_notes')
    
    print(f"   📊 Изменение объема: {volume_change}")
    print(f"   🎯 Фокус тренировки: {training_focus}")
    print(f"   💤 Восстановление: {recovery_notes}")
    
    # Проверяем соответствие ожидаемым условиям сценария
    if expected_conditions:
        print(f"\n🎯 ПРОВЕРКА ОЖИДАНИЙ СЦЕНАРИЯ:")
        for condition, expected in expected_conditions.items():
            actual = recommendations.get(condition)
            if actual == expected:
                print(f"   ✅ {condition}: {actual} (соответствует ожиданиям)")
            else:
                print(f"   ⚠️  {condition}: {actual} (ожидалось: {expected})")
                all_valid = False
    
    return all_valid

# =============================================================================
# ТЕСТОВЫЕ СЦЕНАРИИ
# =============================================================================

SYSTEM_PROMPT = """Ты - опытный фитнес-тренер с 15-летним стажем, специализируешься на силовых тренировках и гипертрофии. 

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ВОЗВРАЩАЙ ТОЛЬКО ЧИСТЫЙ JSON БЕЗ КАКИХ-ЛИБО ОБЪЯСНЕНИЙ И MARKDOWN
2. Не используй ```json или любые другие обертки
3. Анализируй RIR (Reps in Reserve) для принятия решений:
   - RIR > 2.5: увеличивай вес на 2.5-5% (progression_type: "increase_weight")
   - RIR 1.5-2.5: сохраняй вес (progression_type: "maintain") 
   - RIR < 1.0: снижай вес на 2.5-5% (progression_type: "decrease_weight")
   - Высокая усталость + низкий RIR: делай разгрузку (progression_type: "deload")

ВОЗВРАЩАЙ ОТВЕТ ТОЛЬКО В ФОРМАТЕ JSON:

{
    "recommendations": [
        {
            "exercise_name": "Название упражнения",
            "sets": 3,
            "reps": 8,
            "weight_kg": 75.0,
            "target_rir": 2.0,
            "rationale": "Краткое логическое обоснование, соответствующее progression_type",
            "progression_type": "increase_weight|maintain|decrease_weight|deload"
        }
    ],
    "overall_volume_change": "increase|maintain|decrease",
    "training_focus": "strength|hypertrophy|technique",
    "recovery_notes": "Конкретные рекомендации по восстановлению"
}"""

def test_scenario_1_normal_case():
    """1. Нормальный случай - умеренная усталость, средний RIR"""
    workout_data = {
        "user_profile": {
            "training_goal": "hypertrophy",
            "experience_level": "intermediate",
            "body_weight": 75.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Жим штанги лежа",
                        "sets": [
                            {"set_number": 1, "weight_kg": 80, "reps": 8, "rir": 2.0},
                            {"set_number": 2, "weight_kg": 80, "reps": 7, "rir": 1.5},
                            {"set_number": 3, "weight_kg": 80, "reps": 6, "rir": 1.0}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "moderate",
        "sleep_quality_last_night": "good",
        "stress_level": "medium"
    }
    
    user_prompt = f"Проанализируй эту историю тренировок и дай рекомендации:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "1. НОРМАЛЬНЫЙ СЛУЧАЙ", user_prompt, {"training_focus": "hypertrophy"}

def test_scenario_2_no_history():
    """2. Первая тренировка - нет истории"""
    workout_data = {
        "user_profile": {
            "training_goal": "hypertrophy",
            "experience_level": "beginner",
            "body_weight": 70.0
        },
        "recent_workouts": [],
        "current_fatigue_level": "low",
        "sleep_quality_last_night": "excellent",
        "stress_level": "low"
    }
    
    user_prompt = f"Это первая тренировка пользователя. Дай стартовые рекомендации:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "2. ПЕРВАЯ ТРЕНИРОВКА (нет истории)", user_prompt, {"overall_volume_change": "maintain"}

def test_scenario_3_high_rir():
    """3. Слишком легкая тренировка - высокий RIR"""
    workout_data = {
        "user_profile": {
            "training_goal": "strength",
            "experience_level": "intermediate",
            "body_weight": 80.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Становая тяга",
                        "sets": [
                            {"set_number": 1, "weight_kg": 120, "reps": 8, "rir": 4.0},
                            {"set_number": 2, "weight_kg": 120, "reps": 8, "rir": 3.5},
                            {"set_number": 3, "weight_kg": 120, "reps": 8, "rir": 3.0}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "low",
        "sleep_quality_last_night": "good",
        "stress_level": "low"
    }
    
    user_prompt = f"Проанализируй историю. RIR слишком высокий:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "3. ВЫСОКИЙ RIR (слишком легко)", user_prompt, {"overall_volume_change": "increase"}

def test_scenario_4_low_rir_high_fatigue():
    """4. Перетренированность - низкий RIR + высокая усталость"""
    workout_data = {
        "user_profile": {
            "training_goal": "hypertrophy",
            "experience_level": "advanced",
            "body_weight": 85.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Приседания со штангой",
                        "sets": [
                            {"set_number": 1, "weight_kg": 140, "reps": 3, "rir": 0.5},
                            {"set_number": 2, "weight_kg": 140, "reps": 2, "rir": 0.0},
                            {"set_number": 3, "weight_kg": 140, "reps": 1, "rir": 0.0}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "high",
        "sleep_quality_last_night": "poor",
        "stress_level": "high"
    }
    
    user_prompt = f"Пользователь перетренирован. RIR очень низкий, усталость высокая:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "4. НИЗКИЙ RIR + ВЫСОКАЯ УСТАЛОСТЬ", user_prompt, {"overall_volume_change": "decrease"}

def test_scenario_5_multiple_exercises():
    """5. Несколько упражнений с разным RIR"""
    workout_data = {
        "user_profile": {
            "training_goal": "hypertrophy",
            "experience_level": "intermediate",
            "body_weight": 75.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Жим штанги лежа",
                        "sets": [
                            {"set_number": 1, "weight_kg": 80, "reps": 8, "rir": 3.0},
                            {"set_number": 2, "weight_kg": 80, "reps": 8, "rir": 2.5}
                        ],
                        "target_rir": 2.0
                    },
                    {
                        "name": "Тяга верхнего блока",
                        "sets": [
                            {"set_number": 1, "weight_kg": 60, "reps": 10, "rir": 1.0},
                            {"set_number": 2, "weight_kg": 60, "reps": 8, "rir": 0.5}
                        ],
                        "target_rir": 2.0
                    },
                    {
                        "name": "Приседания",
                        "sets": [
                            {"set_number": 1, "weight_kg": 100, "reps": 8, "rir": 2.0},
                            {"set_number": 2, "weight_kg": 100, "reps": 8, "rir": 1.5}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "moderate",
        "sleep_quality_last_night": "average",
        "stress_level": "medium"
    }
    
    user_prompt = f"Проанализируй тренировку с несколькими упражнениями:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "5. НЕСКОЛЬКО УПРАЖНЕНИЙ", user_prompt, {}

def test_scenario_6_endurance_training():
    """6. Тренировка на выносливость"""
    workout_data = {
        "user_profile": {
            "training_goal": "endurance",
            "experience_level": "intermediate",
            "body_weight": 68.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Бег на дорожке",
                        "sets": [
                            {"set_number": 1, "weight_kg": None, "reps": None, "rir": 2.0, "duration_min": 30, "distance_km": 5.0}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "low",
        "sleep_quality_last_night": "good",
        "stress_level": "low"
    }
    
    user_prompt = f"Проанализируй тренировку на выносливость:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "6. ВЫНОСЛИВОСТЬ", user_prompt, {"training_focus": "endurance"}

def test_scenario_7_deload_week():
    """7. Неделя разгрузки - плановая"""
    workout_data = {
        "user_profile": {
            "training_goal": "strength",
            "experience_level": "advanced",
            "body_weight": 90.0,
            "deload_week": True
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Жим лежа",
                        "sets": [
                            {"set_number": 1, "weight_kg": 120, "reps": 3, "rir": 0.5},
                            {"set_number": 2, "weight_kg": 120, "reps": 2, "rir": 0.0}
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "high",
        "sleep_quality_last_night": "poor",
        "stress_level": "medium"
    }
    
    user_prompt = f"Это неделя разгрузки. Дай соответствующие рекомендации:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "7. РАЗГРУЗОЧНАЯ НЕДЕЛЯ", user_prompt, {"overall_volume_change": "decrease"}

def test_scenario_8_contradictory_data():
    """8. Противоречивые данные - проверим логику"""
    workout_data = {
        "user_profile": {
            "training_goal": "hypertrophy",
            "experience_level": "intermediate",
            "body_weight": 75.0
        },
        "recent_workouts": [
            {
                "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                "exercises": [
                    {
                        "name": "Жим гантелей",
                        "sets": [
                            {"set_number": 1, "weight_kg": 25, "reps": 15, "rir": 4.0},  # Очень высокий RIR
                            {"set_number": 2, "weight_kg": 25, "reps": 12, "rir": 1.0}   # Очень низкий RIR
                        ],
                        "target_rir": 2.0
                    }
                ]
            }
        ],
        "current_fatigue_level": "low",  # Низкая усталость при плохих показателях
        "sleep_quality_last_night": "excellent",
        "stress_level": "low"
    }
    
    user_prompt = f"Проанализируй противоречивые данные:\n{json.dumps(workout_data, ensure_ascii=False, indent=2)}"
    
    return "8. ПРОТИВОРЕЧИВЫЕ ДАННЫЕ", user_prompt, {}

def run_all_tests():
    """Запускаем все тестовые сценарии"""
    
    test_scenarios = [
        test_scenario_1_normal_case,
        test_scenario_2_no_history,
        test_scenario_3_high_rir,
        test_scenario_4_low_rir_high_fatigue,
        test_scenario_5_multiple_exercises,
        test_scenario_6_endurance_training,
        test_scenario_7_deload_week,
        test_scenario_8_contradictory_data
    ]
    
    results = []
    
    print("🚀 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ LLM")
    print("=" * 70)
    
    for test_func in test_scenarios:
        scenario_name, user_prompt, expected_conditions = test_func()
        
        print(f"\n🎯 ТЕСТ: {scenario_name}")
        print("=" * 50)
        
        start_time = time.time()
        success, response = call_llm_api(SYSTEM_PROMPT, user_prompt)
        response_time = time.time() - start_time
        
        if success:
            print(f"✅ LLM ответила за {response_time:.2f} сек")
            
            # Пытаемся распарсить JSON
            clean_content = extract_json_from_response(response)
            try:
                recommendations = json.loads(clean_content)
                is_valid = analyze_recommendations_quality(recommendations, scenario_name, expected_conditions)
                results.append((scenario_name, True, is_valid, response_time))
            except json.JSONDecodeError:
                print(f"❌ Невалидный JSON в ответе")
                print(f"📝 Ответ: {response[:500]}...")
                results.append((scenario_name, True, False, response_time))
        else:
            print(f"❌ Ошибка: {response}")
            results.append((scenario_name, False, False, response_time))
        
        # Небольшая пауза между запросами
        time.sleep(2)
    
    # Выводим сводку
    print("\n" + "=" * 70)
    print("📊 СВОДКА РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ")
    print("=" * 70)
    
    for scenario_name, api_success, logic_valid, response_time in results:
        status = "✅ УСПЕХ" if (api_success and logic_valid) else "⚠️  ПРОБЛЕМЫ" if api_success else "❌ ОШИБКА"
        print(f"{scenario_name:<40} {status:<15} {response_time:5.1f} сек")
    
    total_tests = len(results)
    passed_tests = sum(1 for _, api_success, logic_valid, _ in results if api_success and logic_valid)
    api_success_count = sum(1 for _, api_success, _, _ in results if api_success)
    
    print(f"\n🎯 ИТОГО: {passed_tests}/{total_tests} тестов прошли успешно")
    print(f"📡 API успешно: {api_success_count}/{total_tests}")
    
    if passed_tests == total_tests:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! LLM готова к интеграции!")
    else:
        print(f"\n🔧 НЕОБХОДИМО ДОРАБОТАТЬ: {total_tests - passed_tests} тестов имеют проблемы")

if __name__ == "__main__":
    run_all_tests()