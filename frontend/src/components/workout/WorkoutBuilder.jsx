import React, { useState } from 'react'
import ExerciseCard from './ExerciseCard'
import { useExercises } from '../../hooks/useExercises'
import { workoutService } from '../../services/workoutService'
import { Plus, Search, GripVertical } from 'lucide-react'
import { 
  handleDragStart, 
  handleDragOver, 
  handleDrop, 
  handleDragEnd, 
  handleDragEnter, 
  handleDragLeave 
} from '../../utils/dragAndDrop'

const WorkoutBuilder = ({ workoutData, onChange }) => {
  const { exercises, loading } = useExercises()
  const [searchTerm, setSearchTerm] = useState('')
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [error, setError] = useState(null)

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addExercise = (exercise) => {
    const newExercise = {
      exercise_id: exercise.id,
      exercise: exercise,
      order: workoutData.exercises.length,
      notes: '',
      sets: Array.from({ length: exercise.default_sets || 3 }, (_, i) => ({
        set_number: i + 1,
        weight_kg: 0,
        reps: exercise.default_reps || 10,
        rir: 2,
        completed: false
      }))
    }

    onChange({
      ...workoutData,
      exercises: [...workoutData.exercises, newExercise]
    })
    setShowExerciseLibrary(false)
    setSearchTerm('')
  }

  const updateExercise = (index, updatedExercise) => {
    const updatedExercises = [...workoutData.exercises]
    updatedExercises[index] = updatedExercise
    onChange({ ...workoutData, exercises: updatedExercises })
  }

  const removeExercise = (index) => {
    const updatedExercises = workoutData.exercises.filter((_, i) => i !== index)
    onChange({ ...workoutData, exercises: updatedExercises })
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
      setError('Failed to get AI recommendation')
      console.error('Recommendation error:', error)
      throw error
    }
  }

  const handleExerciseDrop = (e, toIndex) => {
    handleDrop(e, toIndex, workoutData.exercises, (newExercises) => {
      onChange({ ...workoutData, exercises: newExercises })
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Exercises</h2>
          <button
            onClick={() => setShowExerciseLibrary(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        {workoutData.exercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No exercises added yet. Click "Add Exercise" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutData.exercises.map((exercise, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleExerciseDrop(e, index)}
                onDragEnd={handleDragEnd}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className="relative group"
              >
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                </div>
                <div className="pl-8">
                  <ExerciseCard
                    exercise={exercise}
                    index={index}
                    onUpdate={(updated) => updateExercise(index, updated)}
                    onRemove={() => removeExercise(index)}
                    onGetRecommendation={handleGetRecommendation}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercise Library Modal */}
      {showExerciseLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Exercise</h3>
                <button
                  onClick={() => setShowExerciseLibrary(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading exercises...</div>
              ) : filteredExercises.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No exercises found</div>
              ) : (
                <div className="divide-y">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      onClick={() => addExercise(exercise)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{exercise.name}</p>
                          <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                            {exercise.muscle_group && (
                              <span>Muscle: {exercise.muscle_group}</span>
                            )}
                            {exercise.equipment && (
                              <span>Equipment: {exercise.equipment.name}</span>
                            )}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutBuilder