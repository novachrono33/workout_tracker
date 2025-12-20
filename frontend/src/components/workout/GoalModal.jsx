// frontend/src/components/workout/GoalModal.jsx
import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const GoalModal = ({ isOpen, onClose, currentGoal, onGoalChange }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  const goals = [
    { value: 'strength', label: 'Сила', description: '1-6 повторений, тяжелые веса' },
    { value: 'hypertrophy', label: 'Гипертрофия', description: '8-12 повторений, средние веса' },
    { value: 'endurance', label: 'Выносливость', description: '12+ повторений, легкие веса' }
  ]

  const getGoalLabel = (goalValue) => {
    const goal = goals.find(g => g.value === goalValue)
    return goal ? goal.label : goalValue
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleGoalSelect = (goalValue) => {
    onGoalChange(goalValue)
    handleClose()
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-lg max-w-md w-full transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Выберите цель тренировки</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => handleGoalSelect(goal.value)}
                className={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${
                  currentGoal === goal.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 transform scale-[1.02]'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{goal.label}</div>
                <div className="text-sm text-gray-600 mt-1">{goal.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Цель влияет на рекомендации по весам и количеству повторений
          </p>
        </div>
      </div>
    </div>
  )
}

export default GoalModal