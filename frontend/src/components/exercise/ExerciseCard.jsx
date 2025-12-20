import React from 'react'
import { Dumbbell, Edit, Trash2 } from 'lucide-react'

const ExerciseCard = ({ exercise, onEdit, onDelete, onAddToWorkout, isDeleting = false }) => {
  return (
    <div className={`
      bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-300
      ${isDeleting ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <Dumbbell className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onAddToWorkout && (
            <button
              onClick={() => onAddToWorkout(exercise)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Добавить
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {exercise.muscle_coefficients && Object.keys(exercise.muscle_coefficients).length > 0 && (
        <div className="space-y-1 text-sm text-gray-600">
          <span className="font-medium">Мышечные группы:</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(exercise.muscle_coefficients).map(([muscle, coeff]) => (
              <span 
                key={muscle} 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {muscle}: {coeff.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseCard