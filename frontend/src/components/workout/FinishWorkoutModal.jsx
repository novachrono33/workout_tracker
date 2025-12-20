import React, { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'

const FinishWorkoutModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  workout, 
  initialName = '',
  initialNotes = '',
  isEdit = false,
  duration = 0,
  error = null,
  loading = false
}) => {
  const [name, setName] = useState(initialName)
  const [notes, setNotes] = useState(initialNotes)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const MAX_NOTES_LENGTH = 500 // Уменьшено до 500 символов

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setNotes(initialNotes)
      // Преобразуем общую длительность в минутах в часы и минуты
      const totalMinutes = duration || 0
      setHours(Math.floor(totalMinutes / 60))
      setMinutes(totalMinutes % 60)
    }
  }, [isOpen, initialName, initialNotes, duration])

  const handleSave = () => {
    const totalMinutes = hours * 60 + minutes
    onSave(name, notes, totalMinutes)
  }

  const handleNotesChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_NOTES_LENGTH) {
      setNotes(value)
    }
  }

  const handleHoursChange = (e) => {
    const value = parseInt(e.target.value) || 0
    setHours(Math.max(0, Math.min(23, value)))
  }

  const handleMinutesChange = (e) => {
    const value = parseInt(e.target.value) || 0
    setMinutes(Math.max(0, Math.min(59, value)))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Сохранить изменения' : 'Завершить тренировку'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Отображение ошибок */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  {error.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Статистика тренировки */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Статистика тренировки</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Упражнений:</span>
                <span className="ml-2 font-medium">{workout.exercises.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Подходов:</span>
                <span className="ml-2 font-medium">
                  {workout.exercises.reduce((total, ex) => total + (ex.sets?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Длительность тренировки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Длительность тренировки
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Часы</label>
                <input
                  type="number"
                  value={hours}
                  onChange={handleHoursChange}
                  min="0"
                  max="23"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Минуты</label>
                <input
                  type="number"
                  value={minutes}
                  onChange={handleMinutesChange}
                  min="0"
                  max="59"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Всего</label>
                <div className="w-full px-3 py-2 bg-gray-100 rounded-lg text-center text-sm font-medium">
                  {hours * 60 + minutes} мин
                </div>
              </div>
            </div>
          </div>

          {/* Название тренировки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название тренировки
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название тренировки"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Заметки с счетчиком символов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметки (необязательно)
            </label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Добавьте заметки к тренировке..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {notes.length} из {MAX_NOTES_LENGTH} символов
              </span>
              {notes.length > MAX_NOTES_LENGTH * 0.8 && (
                <span className="text-xs text-amber-600">
                  Осталось {MAX_NOTES_LENGTH - notes.length} символов
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Сохранение...</span>
              </>
            ) : (
              <span>{isEdit ? 'Сохранить изменения' : 'Завершить тренировку'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FinishWorkoutModal