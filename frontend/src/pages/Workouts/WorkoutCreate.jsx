import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { workoutService } from '../../services/workoutService'
import ExerciseLibrary from '../../components/workout/ExerciseLibrary'
import WorkoutExercisesDnd from '../../components/workout/WorkoutExercisesDnd'
import FinishWorkoutModal from '../../components/workout/FinishWorkoutModal'
import GoalModal from '../../components/workout/GoalModal'
import Timer from '../../components/workout/Timer'
import { Save, ArrowLeft, Settings } from 'lucide-react'

const WorkoutCreate = () => {
  const navigate = useNavigate()
  const [workoutData, setWorkoutData] = useState({
    name: '',
    exercises: [],
    goal: 'hypertrophy'
  })
  const [loading, setLoading] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [workoutDuration, setWorkoutDuration] = useState(0)

  console.log('WorkoutCreate: current exercises', workoutData.exercises.length)
  
  const validateWorkoutData = (workoutData) => {
    for (const exercise of workoutData.exercises) {
      for (const set of exercise.sets) {
        if (set.weight_kg !== null && set.weight_kg !== undefined) {
          if (set.weight_kg < 0) {
            return { isValid: false, message: 'Вес не может быть отрицательным' }
          }
          if (set.weight_kg > 1000) {
            return { isValid: false, message: 'Вес не может превышать 1000 кг' }
          }
        }
        
        if (set.reps !== null && set.reps !== undefined) {
          if (set.reps < 0) {
            return { isValid: false, message: 'Повторения не могут быть отрицательными' }
          }
          if (set.reps > 100) {
            return { isValid: false, message: 'Повторения не могут превышать 100' }
          }
        }
        
        if (set.rir !== null && set.rir !== undefined) {
          if (set.rir < 0) {
            return { isValid: false, message: 'RIR не может быть отрицательным' }
          }
          if (set.rir > 10) {
            return { isValid: false, message: 'RIR не может превышать 10' }
          }
        }
      }
    }
    return { isValid: true }
  }

  const addExercise = (exercise) => {
    console.log('Adding exercise via click:', exercise.name)
    const newExercise = {
      exercise_id: exercise.id,
      exercise: exercise,
      tempId: `exercise-${Date.now()}-${Math.random()}`,
      order: workoutData.exercises.length,
      sets: Array.from({ length: 3 }, (_, i) => ({
        set_number: i + 1,
        weight_kg: 0.0,
        reps: 10,
        rir: 2.0
      }))
    }

    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const updateExercise = (index, updatedExercise) => {
    const updatedExercises = [...workoutData.exercises]
    updatedExercises[index] = updatedExercise
    setWorkoutData(prev => ({ ...prev, exercises: updatedExercises }))
  }

  const removeExercise = (index) => {
    const updatedExercises = workoutData.exercises.filter((_, i) => i !== index)
    setWorkoutData(prev => ({ ...prev, exercises: updatedExercises }))
  }

  const reorderExercises = (newExercises) => {
    console.log('Reordering exercises, new count:', newExercises.length)
    setWorkoutData(prev => ({ ...prev, exercises: newExercises }))
  }

  const handleGoalChange = (newGoal) => {
    setWorkoutData(prev => ({ ...prev, goal: newGoal }))
  }

  const getGoalLabel = (goal) => {
    switch(goal) {
      case 'strength': return 'Сила'
      case 'hypertrophy': return 'Гипертрофия'
      case 'endurance': return 'Выносливость'
      default: return goal
    }
  }

  const handleGetRecommendation = async (exercise) => {
    try {
      const currentWorkoutData = {
        exercises: workoutData.exercises.map(ex => ({
          exercise_id: ex.exercise_id,
          sets: ex.sets
        }))
      }
      
      return await workoutService.getRecommendation(exercise.exercise_id, currentWorkoutData)
    } catch (error) {
      console.error('Recommendation error:', error)
      throw error
    }
  }

  const handleSaveWorkout = async (name, notes, duration = workoutDuration) => {
    if (workoutData.exercises.length === 0) {
      setValidationError('Добавьте хотя бы одно упражнение в тренировку')
      return
    }

    // Валидация данных перед отправкой
    const validation = validateWorkoutData(workoutData)
    if (!validation.isValid) {
      setValidationError(validation.message)
      return
    }

    setLoading(true)
    setValidationError(null)
    
    try {
      const workoutToSave = {
        ...workoutData,
        name: name,
        notes: notes,
        duration_minutes: duration,
        exercises: workoutData.exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          order: index,
          notes: exercise.notes || '',
          target_rir: exercise.target_rir || 2.0,
          sets: exercise.sets.map(set => ({
            set_number: set.set_number,
            weight_kg: set.weight_kg,
            reps: set.reps,
            rir: set.rir
          }))
        }))
      }
      
      const newWorkout = await workoutService.createWorkout(workoutToSave)
      navigate(`/workouts/${newWorkout.id}`)
    } catch (error) {
      console.error('Failed to create workout:', error)
      
      let errorMessage = 'Ошибка при создании тренировки'
      
      if (error.response?.status === 422) {
        // Обработка ошибок валидации от бэкенда
        const validationErrors = error.response.data.detail
        if (Array.isArray(validationErrors)) {
          errorMessage = validationErrors.map(err => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join('\n')
        } else if (typeof validationErrors === 'string') {
          errorMessage = validationErrors
        } else {
          errorMessage = 'Неверные данные. Проверьте все поля.'
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else {
        errorMessage = error.message
      }
      
      setValidationError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearValidationError = () => {
    setValidationError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b max-w-7xl mx-auto px-6">
        <div className="py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/workouts')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад к тренировкам</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">
              Создание тренировки
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Цель тренировки и таймер */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Цель тренировки:{' '}
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium underline flex items-center space-x-1"
            >
              <span>{getGoalLabel(workoutData.goal)}</span>
              <Settings className="h-3 w-3" />
            </button>
          </div>
          
          <Timer onDurationChange={setWorkoutDuration} />

          <div className="text-xs text-gray-500">
            {workoutData.exercises.length} упражнений
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Exercise Library - Left Sidebar */}
          <div className="xl:col-span-1">
            <ExerciseLibrary onExerciseSelect={addExercise} />
          </div>

          {/* Workout Exercises - Main Content */}
          <div className="xl:col-span-3 space-y-6">
            <WorkoutExercisesDnd
              exercises={workoutData.exercises}
              onUpdateExercise={updateExercise}
              onRemoveExercise={removeExercise}
              onReorderExercises={reorderExercises}
              onGetRecommendation={handleGetRecommendation}
            />
            
            {/* Кнопка сохранения */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowFinishModal(true)}
                disabled={workoutData.exercises.length === 0 || loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="h-5 w-5" />
                <span>Завершить тренировку</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для смены цели */}
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={workoutData.goal}
        onGoalChange={handleGoalChange}
      />

      {/* Finish Workout Modal */}
      <FinishWorkoutModal
        isOpen={showFinishModal}
        onClose={() => {
          setShowFinishModal(false)
          clearValidationError()
        }}
        onSave={handleSaveWorkout}
        workout={workoutData}
        initialName={workoutData.name}
        error={validationError}
        loading={loading}
        duration={workoutDuration}
      />
    </div>
  )
}

export default WorkoutCreate