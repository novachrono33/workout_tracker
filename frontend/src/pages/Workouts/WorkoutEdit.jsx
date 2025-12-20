import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { workoutService } from '../../services/workoutService'
import ExerciseLibrary from '../../components/workout/ExerciseLibrary'
import WorkoutExercisesDnd from '../../components/workout/WorkoutExercisesDnd'
import FinishWorkoutModal from '../../components/workout/FinishWorkoutModal'
import GoalModal from '../../components/workout/GoalModal'
import { Save, ArrowLeft, Settings } from 'lucide-react'

const WorkoutEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workoutData, setWorkoutData] = useState({
    name: '',
    exercises: [],
    goal: 'hypertrophy'
  })
  const [loading, setLoading] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [workoutStartTime, setWorkoutStartTime] = useState(null)
  const [workoutDuration, setWorkoutDuration] = useState(0)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        console.log('🔄 Fetching workout data for ID:', id)
        const workout = await workoutService.getWorkout(id)
        console.log('📥 Received workout data:', workout)
        
        // Запускаем таймер, если тренировка уже была начата
        if (workout.date && !workout.duration_minutes) {
          const startTime = new Date(workout.date)
          setWorkoutStartTime(startTime)
          const currentDuration = Math.floor((new Date() - startTime) / 60000) // в минутах
          setWorkoutDuration(currentDuration)
        }

        // Правильно преобразуем данные тренировки
        const formattedExercises = workout.exercises ? workout.exercises.map(exercise => ({
          ...exercise,
          tempId: `exercise-${exercise.id}-${Date.now()}`,
          // Сохраняем существующие подходы
          sets: exercise.sets ? exercise.sets.map(set => ({
            ...set,
            weight_kg: set.weight_kg !== null ? Number(set.weight_kg) : null,
            reps: set.reps !== null ? Number(set.reps) : null,
            rir: set.rir !== null ? Number(set.rir) : null
          })) : []
        })) : []

        console.log('📋 Formatted exercises:', formattedExercises)

        setWorkoutData({
          name: workout.name,
          exercises: formattedExercises,
          goal: workout.training_goal || 'hypertrophy',
          notes: workout.notes
        })
      } catch (error) {
        console.error('❌ Failed to fetch workout:', error)
        alert('Ошибка при загрузке тренировки: ' + (error.response?.data?.detail || error.message))
        navigate('/workouts')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchWorkout()
  }, [id, navigate])

  // Запускаем таймер при добавлении первого упражнения
  useEffect(() => {
    if (workoutData.exercises.length > 0 && !workoutStartTime) {
      const startTime = new Date()
      setWorkoutStartTime(startTime)
      console.log('⏱️ Workout timer started:', startTime)
    }
  }, [workoutData.exercises.length, workoutStartTime])

  // Обновляем продолжительность каждую минуту
  useEffect(() => {
    if (!workoutStartTime) return

    const timer = setInterval(() => {
      const currentDuration = Math.floor((new Date() - workoutStartTime) / 60000)
      setWorkoutDuration(currentDuration)
    }, 60000) // Обновляем каждую минуту

    return () => clearInterval(timer)
  }, [workoutStartTime])

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
    console.log('➕ Adding exercise:', exercise.name)
    const newExercise = {
      exercise_id: exercise.id,
      exercise: exercise,
      tempId: `exercise-${Date.now()}-${Math.random()}`,
      order: workoutData.exercises.length,
      sets: Array.from({ length: 3 }, (_, i) => ({
        set_number: i + 1,
        weight_kg: null,
        reps: null,
        rir: null
      }))
    }

    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const updateExercise = (index, updatedExercise) => {
    console.log('✏️ Updating exercise at index:', index, updatedExercise)
    const updatedExercises = [...workoutData.exercises]
    updatedExercises[index] = updatedExercise
    setWorkoutData(prev => ({ ...prev, exercises: updatedExercises }))
  }

  const removeExercise = (index) => {
    console.log('🗑️ Removing exercise at index:', index)
    const updatedExercises = workoutData.exercises.filter((_, i) => i !== index)
    setWorkoutData(prev => ({ ...prev, exercises: updatedExercises }))
  }

  const reorderExercises = (newExercises) => {
    console.log('🔀 Reordering exercises:', newExercises.length)
    setWorkoutData(prev => ({ ...prev, exercises: newExercises }))
  }

  const handleGoalChange = (newGoal) => {
    console.log('🎯 Changing goal to:', newGoal)
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

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}ч ${mins}м`
    }
    return `${mins}м`
  }

  const handleUpdateWorkout = async (name, notes) => {
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
      const finalDuration = workoutDuration > 0 ? workoutDuration : null

      const workoutToUpdate = {
        name: name || workoutData.name,
        notes: notes || workoutData.notes || '',
        training_goal: workoutData.goal,
        duration_minutes: finalDuration,
        exercises: workoutData.exercises.map((exercise, index) => ({
          exercise_id: exercise.exercise_id,
          order: index,
          notes: exercise.notes || '',
          target_rir: exercise.target_rir || 2,
          sets: exercise.sets.map(set => ({
            set_number: set.set_number,
            weight_kg: set.weight_kg,
            reps: set.reps,
            rir: set.rir
          }))
        }))
      }
      
      console.log('📤 Sending update data:', workoutToUpdate)
      const response = await workoutService.updateWorkout(id, workoutToUpdate)
      console.log('📥 Update response:', response)
      
      navigate(`/workouts/${id}`, { state: { refresh: true } })
    } catch (error) {
      console.error('❌ Failed to update workout:', error)
      let errorMessage = 'Ошибка при обновлении тренировки'
      
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

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b py-4">
        <div className="flex items-center px-6">
          <button
            onClick={() => navigate(`/workouts/${id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к тренировке</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">
            Редактирование тренировки
          </h1>
        </div>
      </div>

      {/* Основной контент */}
      <div className="px-6 py-6">
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
          {workoutDuration > 0 && (
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
              ⏱️ Длительность: {formatDuration(workoutDuration)}
            </div>
          )}
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
              // AI рекомендации удалены
            />
            
            {/* Кнопка сохранения ПЕРЕМЕЩЕНА СЮДА - сразу после упражнений */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setShowFinishModal(true)}
                disabled={workoutData.exercises.length === 0 || loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Сохранение...' : 'Сохранить изменения'}</span>
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
        onSave={handleUpdateWorkout}
        workout={workoutData}
        initialName={workoutData.name}
        initialNotes={workoutData.notes}
        isEdit={true}
        duration={workoutDuration}
        error={validationError}
        loading={loading}
      />
    </div>
  )
}

export default WorkoutEdit