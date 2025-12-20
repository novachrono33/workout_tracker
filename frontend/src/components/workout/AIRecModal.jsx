// frontend/src/components/workout/AIRecModal.jsx
import React, { useEffect, useState } from 'react'
import { X, AlertCircle, Loader2, Info } from 'lucide-react'

const AIRecModal = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  exerciseName,
  recommendation,
  loading,
  error
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  const handleAccept = () => {
    console.log('AIRecModal: handleAccept called')
    console.log('Recommendation data:', recommendation)
    
    if (recommendation && recommendation.success) {
      onAccept(recommendation)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const renderSetsTable = (setsArray) => {
    if (!setsArray || setsArray.length === 0) return null

    return (
      <div className="space-y-3 mb-6">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Рекомендуемые дополнительные подходы
        </div>
        
        <div className="bg-gray-50 rounded-lg overflow-hidden border">
          {/* Заголовки таблицы */}
          <div className="grid grid-cols-12 gap-1 bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 text-center">Вес (кг)</div>
            <div className="col-span-3 text-center">Повторы</div>
            <div className="col-span-3 text-center">Цель RIR</div>
          </div>

          {/* Строки с подходами */}
          <div className="divide-y">
            {setsArray.map((set, index) => (
              <div key={set.set_number || index} className="grid grid-cols-12 gap-1 px-3 py-2 hover:bg-gray-50">
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {set.set_number || index + 1}
                  </span>
                </div>
                
                <div className="col-span-5">
                  <div className="text-center text-sm font-semibold text-gray-900 bg-white border rounded py-1">
                    {set.weight_kg ? set.weight_kg.toFixed(1) : 0} кг
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="text-center text-sm font-semibold text-gray-900 bg-white border rounded py-1">
                    {set.reps || 0}
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className={`text-center text-sm font-semibold rounded py-1 ${
                    set.target_rir >= 2.5 ? 'bg-green-50 text-green-800 border border-green-200' :
                    set.target_rir >= 2 ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                    set.target_rir >= 1.5 ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                    'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {set.target_rir ? set.target_rir.toFixed(1) : 2.0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 italic">
          Эти подходы будут добавлены к уже существующим
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Анализируем ваши данные</p>
          <p className="text-sm text-gray-500 text-center max-w-sm">
            Анализируем историю тренировок за последний месяц...
          </p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Ошибка</p>
          <p className="text-sm text-gray-500 text-center mb-4 max-w-sm">
            {error}
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      )
    }

    // Обработка случая, когда нужен первый подход
    if (recommendation && recommendation.requires_initial_set) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Нужны данные для анализа</p>
          <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
            {recommendation.message || "Для получения точной рекомендации сначала добавьте подход с вашими текущими рабочими весами."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Хорошо
            </button>
          </div>
        </div>
      )
    }

    if (recommendation && recommendation.success) {
      const setsArray = recommendation.sets_array || []
      
      return (
        <>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Для упражнения <span className="font-semibold text-blue-600">{exerciseName}</span>
              </p>
              
              {/* Таблица подходов */}
              {setsArray.length > 0 ? (
                renderSetsTable(setsArray)
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                    <p className="font-medium text-gray-700 mb-1">Дополнительные подходы не нужны</p>
                    <p className="text-sm text-gray-500">
                      {recommendation.message || "Вы уже выполнили оптимальный объем для этого упражнения."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAccept}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={!setsArray || setsArray.length === 0}
            >
              {setsArray && setsArray.length > 0 ? 'Добавить подходы' : 'Закрыть'}
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Отклонить
            </button>
          </div>
        </>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">Рекомендация не доступна</p>
        <p className="text-sm text-gray-500 text-center mb-4 max-w-sm">
          Не удалось получить рекомендацию от ИИ. Попробуйте позже.
        </p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Закрыть
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 relative">
            <h2 className="text-xl font-semibold text-gray-900">
              Рекомендация ИИ
            </h2>
            <div 
              className="relative"
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <div className="cursor-pointer flex items-center">
                <Info className="h-5 w-5 text-gray-400 hover:text-blue-600 transition-colors" />
              </div>
              {showInfoTooltip && (
                <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20" style={{ marginTop: '-10px' }}>
                  <p className="text-xs text-gray-700">
                    <strong>Внимание!</strong> Эти подходы будут добавлены к уже существующим. Рекомендации основаны на ваших текущих подходах и истории тренировок.
                  </p>
                  <div className="absolute right-full top-4 w-2 h-2 bg-white border-l border-b border-gray-200 transform rotate-45 -mr-1"></div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default AIRecModal