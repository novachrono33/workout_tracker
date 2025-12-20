// frontend/src/components/workout/ExerciseCard.jsx
import React, { useState } from 'react'
import { ChevronUp, ChevronDown, Dumbbell } from 'lucide-react'
import SetInput from './SetInput'
import AIRecModal from './AIRecModal'
import { useAIRec } from '../../hooks/useAIRec'

const ExerciseCard = ({ exercise, index, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAIRecModal, setShowAIRecModal] = useState(false)
  
  const { loading, error, recommendation, getRecommendation, clearRecommendation } = useAIRec()

  const updateSet = (setIndex, updatedSet) => {
    const updatedSets = [...exercise.sets]
    updatedSets[setIndex] = { ...updatedSets[setIndex], ...updatedSet }
    onUpdate({ ...exercise, sets: updatedSets })
  }

  const addSet = () => {
    const newSetNumber = exercise.sets.length + 1
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSet = {
      set_number: newSetNumber,
      weight_kg: lastSet?.weight_kg || 0,
      reps: lastSet?.reps || 10,
      rir: 2
    }
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] })
  }

  const removeSet = (setIndex) => {
    const updatedSets = exercise.sets.filter((_, i) => i !== setIndex)
    const renumberedSets = updatedSets.map((set, index) => ({
      ...set,
      set_number: index + 1
    }))
    onUpdate({ ...exercise, sets: renumberedSets })
  }

  const handleGetAIRec = async () => {
    if (!exercise.exercise?.id) {
      console.error('Упражнение не имеет ID')
      return
    }

    clearRecommendation()
    
    const currentSets = exercise.sets.map(set => ({
      set_number: set.set_number,
      weight_kg: set.weight_kg || 0,
      reps: set.reps || 0,
      rir: set.rir || 2.0
    }))

    try {
      await getRecommendation(exercise.exercise.id, currentSets)
      setShowAIRecModal(true)
    } catch (err) {
      console.error('Ошибка получения рекомендации:', err)
      setShowAIRecModal(true)
    }
  }

  const handleAcceptRecommendation = (rec) => {
    console.log('AI Recommendation accepted:', rec)
    console.log('Current sets:', exercise.sets)
    console.log('Is addition:', rec?.is_addition)
    
    if (!rec || !rec.success) {
      console.error('Некорректная рекомендация')
      setShowAIRecModal(false)
      return
    }

    // ВСЕГДА добавляем подходы, а не заменяем
    if (rec.sets_array && rec.sets_array.length > 0) {
      console.log('Adding new sets:', rec.sets_array)
      
      // Создаем новые подходы из рекомендации
      const newSets = rec.sets_array.map(set => ({
        set_number: exercise.sets.length + 1, // Начинаем с следующего номера
        weight_kg: set.weight_kg || 0,
        reps: set.reps || 0,
        rir: set.target_rir || 2.0
      }))
      
      // Объединяем существующие подходы с новыми
      const updatedSets = [...exercise.sets, ...newSets]
      
      // Пересчитываем номера подходов
      const renumberedSets = updatedSets.map((set, index) => ({
        ...set,
        set_number: index + 1
      }))
      
      console.log('Final sets after addition:', renumberedSets)
      
      onUpdate({
        ...exercise,
        sets: renumberedSets
      })
    } else {
      console.warn('No valid recommendation data found')
    }
    
    setShowAIRecModal(false)
  }

  const handleCloseModal = () => {
    setShowAIRecModal(false)
    clearRecommendation()
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <Dumbbell className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">
                {exercise.exercise?.name || `Exercise ${index + 1}`}
              </h3>
              {exercise.exercise?.muscle_group && (
                <p className="text-sm text-gray-500">{exercise.exercise.muscle_group}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGetAIRec}
              disabled={loading || !exercise.exercise?.id}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Получить AI рекомендацию"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                  <span>AI...</span>
                </>
              ) : (
                'AI Rec'
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4">
            {/* Компактная таблица подходов */}
            <div className="space-y-1">
              {/* Заголовки */}
              <div className="grid grid-cols-12 gap-1 text-xs font-medium text-gray-700 px-1 mb-1">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4 text-center">Вес (кг)</div>
                <div className="col-span-3 text-center">Повторы</div>
                <div className="col-span-3 text-center">RIR</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {exercise.sets.map((set, setIndex) => (
                <SetInput
                  key={setIndex}
                  set={set}
                  onUpdate={(updatedSet) => updateSet(setIndex, updatedSet)}
                  onRemove={() => removeSet(setIndex)}
                />
              ))}

              <button
                onClick={addSet}
                className="w-full py-2.5 text-sm text-blue-600 hover:text-blue-800 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex items-center justify-center gap-1 mt-2 hover:bg-blue-50"
              >
                <span className="text-lg">+</span>
                <span>Добавить подход</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно AI рекомендаций */}
      <AIRecModal
        isOpen={showAIRecModal}
        onClose={handleCloseModal}
        onAccept={handleAcceptRecommendation}
        exerciseName={exercise.exercise?.name || `Упражнение ${index + 1}`}
        recommendation={recommendation}
        loading={loading}
        error={error}
      />
    </>
  )
}

export default ExerciseCard