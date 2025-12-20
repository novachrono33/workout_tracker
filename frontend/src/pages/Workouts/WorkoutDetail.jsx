import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { workoutService } from '../../services/workoutService'
import { Calendar, Clock, Activity, ArrowLeft, Edit, BarChart3, Target, Trash2 } from 'lucide-react'

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, workoutName }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить тренировку</h3>
          <p className="text-gray-600 mb-6">
            Вы уверены, что хотите удалить тренировку "{workoutName}"? Это действие нельзя отменить.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const WorkoutDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('exercises')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 })

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const data = await workoutService.getWorkout(id)
        setWorkout(data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [id])

  const showTooltip = (e, content) => {
    const element = e.currentTarget
    if (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight) {
      setTooltip({
        visible: true,
        content,
        x: e.clientX,
        y: e.clientY
      })
    }
  }

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 })
  }

  const calculateExerciseStats = (exercise) => {
    const sets = exercise.sets || []
    const totalVolume = sets.reduce((total, set) => 
      total + ((set.weight_kg || 0) * (set.reps || 0)), 0
    )
    const avgWeight = sets.length > 0 
      ? sets.reduce((sum, set) => sum + (set.weight_kg || 0), 0) / sets.length 
      : 0
    const avgReps = sets.length > 0
      ? sets.reduce((sum, set) => sum + (set.reps || 0), 0) / sets.length
      : 0

    return { totalVolume, avgWeight, avgReps }
  }

  const handleDeleteWorkout = async () => {
    setDeleteLoading(true)
    try {
      await workoutService.deleteWorkout(id)
      navigate('/workouts')
    } catch (error) {
      console.error('Failed to delete workout:', error)
      alert('Ошибка при удалении тренировки: ' + (error.response?.data?.detail || error.message))
    } finally {
      setDeleteLoading(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg max-w-md mx-auto">
            <p>Error loading workout: {error}</p>
            <Link to="/workouts" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to workouts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p>Workout not found</p>
          <Link to="/workouts" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to workouts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Кастомный тултип */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-md break-words whitespace-pre-line"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
          }}
        >
          {tooltip.content}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteWorkout}
        workoutName={workout.name}
      />

      <div className="mb-6">
        <Link
          to="/workouts"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workouts</span>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workout.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(workout.date).toLocaleDateString()}</span>
              </div>
              {workout.duration_minutes && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{workout.duration_minutes} minutes</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate(`/workouts/${workout.id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>{deleteLoading ? 'Удаление...' : 'Delete'}</span>
            </button>
          </div>
        </div>

        {/* Заметки с сохранением переносов строк и правильным отображением */}
        {workout.notes && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-full">
            <p 
              className="text-blue-800 whitespace-pre-line break-words overflow-wrap-break-word"
              onMouseEnter={(e) => showTooltip(e, workout.notes)}
              onMouseMove={(e) => showTooltip(e, workout.notes)}
              onMouseLeave={hideTooltip}
            >
              {workout.notes}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Exercises</p>
              <p className="text-2xl font-bold text-gray-900">{workout.exercises?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{workout.total_volume || 0} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Sets</p>
              <p className="text-2xl font-bold text-gray-900">
                {workout.exercises?.reduce((total, exercise) => 
                  total + (exercise.sets?.length || 0), 0
                ) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('exercises')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exercises'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Exercises
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {workout.exercises?.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm border">
              <p className="text-gray-500">No exercises in this workout</p>
            </div>
          ) : (
            workout.exercises?.map((exercise, index) => {
              const stats = calculateExerciseStats(exercise)
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {exercise.exercise?.name}
                        </h3>
                        {exercise.exercise?.muscle_group && (
                          <p className="text-sm text-gray-600 mt-1">
                            {exercise.exercise.muscle_group}
                          </p>
                        )}
                        {/* Заметки упражнения с сохранением переносов */}
                        {exercise.notes && (
                          <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{exercise.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Volume: <span className="font-semibold">{stats.totalVolume} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-10 gap-2 text-sm font-medium text-gray-700 mb-4 px-2">
                      <div className="col-span-1 text-center">Set</div>
                      <div className="col-span-3 text-center">Weight (kg)</div>
                      <div className="col-span-3 text-center">Reps</div>
                      <div className="col-span-2 text-center">RIR</div>
                      <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets?.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="grid grid-cols-10 gap-2 items-center text-sm p-2 rounded-lg bg-gray-50"
                        >
                          <div className="col-span-1 text-center font-medium">{set.set_number}</div>
                          <div className="col-span-3 text-center">{set.weight_kg || '-'}</div>
                          <div className="col-span-3 text-center">{set.reps || '-'}</div>
                          <div className="col-span-2 text-center">{set.rir || '-'}</div>
                          <div className="col-span-1"></div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-900">{stats.avgWeight.toFixed(1)}</div>
                        <div className="text-blue-600">Avg Weight (kg)</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-semibold text-green-900">{stats.avgReps.toFixed(1)}</div>
                        <div className="text-green-600">Avg Reps</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="font-semibold text-purple-900">{stats.totalVolume}</div>
                        <div className="text-purple-600">Total Volume</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Muscle Group Distribution</h4>
              <div className="space-y-2">
                {Object.entries(
                  workout.exercises?.reduce((groups, exercise) => {
                    const muscleGroup = exercise.exercise?.muscle_group || 'Other'
                    groups[muscleGroup] = (groups[muscleGroup] || 0) + 1
                    return groups
                  }, {}) || {}
                ).map(([muscleGroup, count]) => (
                  <div key={muscleGroup} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{muscleGroup}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {count} exercise{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Performance Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Volume</span>
                  <span className="text-sm font-medium text-gray-900">{workout.total_volume || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Exercises</span>
                  <span className="text-sm font-medium text-gray-900">{workout.exercises?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sets</span>
                  <span className="text-sm font-medium text-gray-900">
                    {workout.exercises?.reduce((total, exercise) => 
                      total + (exercise.sets?.length || 0), 0
                    ) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutDetail