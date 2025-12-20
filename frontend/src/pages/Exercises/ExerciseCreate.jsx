import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../../hooks/useExercises'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const MUSCLES = [
  'Грудь',
  'Дельты',
  'Задняя дельта',
  'Трицепс',
  'Бицепс',
  'Предплечья',
  'Шея',
  'Спина',
  'Широчайшие',
  'Поясница',
  'Трапеция',
  'Пресс',
  'Ягодицы',
  'Квадрицепсы',
  'Бицепс бедра',
  'Икры'
]

const MAX_NAME_LENGTH = 100
const WARNING_THRESHOLD = 20

const ExerciseCreate = () => {
  const navigate = useNavigate()
  const { createExercise, error: hookError, clearError } = useExercises()
  const [name, setName] = useState('')
  const [muscles, setMuscles] = useState([{ muscle: '', coeff: 1 }])
  const [validationError, setValidationError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hookError) {
      setServerError(hookError)
    }
  }, [hookError])

  useEffect(() => {
    const total = muscles.reduce((sum, m) => sum + (parseFloat(m.coeff) || 0), 0)
    if (Math.abs(total - 1) > 0.001) {
      setValidationError(`Сумма коэффициентов должна быть равна 1. Текущая сумма: ${total.toFixed(2)}`)
    } else {
      setValidationError('')
    }
  }, [muscles])

  const handleNameChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_NAME_LENGTH) {
      setName(value)
    }
    if (serverError) {
      setServerError('')
      clearError()
    }
  }

  const handleMuscleChange = (index, field, value) => {
    const updated = [...muscles]
    updated[index][field] = value
    setMuscles(updated)
  }

  const addMuscle = () => {
    setMuscles([...muscles, { muscle: '', coeff: 0 }])
  }

  const removeMuscle = (index) => {
    if (muscles.length === 1) return
    const updated = muscles.filter((_, i) => i !== index)
    setMuscles(updated)
  }

  const getCharCountColor = () => {
    const remaining = MAX_NAME_LENGTH - name.length
    if (remaining === 0) return 'text-red-600 font-semibold'
    if (remaining <= WARNING_THRESHOLD) return 'text-orange-500'
    return 'text-gray-500'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const total = muscles.reduce((sum, m) => sum + (parseFloat(m.coeff) || 0), 0)
    if (Math.abs(total - 1) > 0.001) {
      setValidationError(`Сумма коэффициентов должна быть равна 1. Текущая сумма: ${total.toFixed(2)}`)
      return
    }

    if (!name.trim()) {
      setValidationError('Название упражнения обязательно')
      return
    }
    
    const muscle_coefficients = muscles.reduce((obj, m) => {
      if (m.muscle && m.coeff > 0) {
        obj[m.muscle] = parseFloat(m.coeff)
      }
      return obj
    }, {})
    
    const formData = {
      name: name.trim(),
      muscle_coefficients
    }
    
    setLoading(true)
    setValidationError('')
    setServerError('')
    clearError()
    
    try {
      await createExercise(formData)
      navigate('/exercises')
    } catch (err) {
      console.log('Error creating exercise:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled = loading || !!validationError

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/exercises')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад к упражнениям</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Создание нового упражнения</h1>
        
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {serverError}
          </div>
        )}

        {validationError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-md mb-4">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Название упражнения *
              </label>
              <span className={`text-xs ${getCharCountColor()}`}>
                {name.length} / {MAX_NAME_LENGTH}
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              maxLength={MAX_NAME_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название упражнения"
              required
            />
            {name.length >= MAX_NAME_LENGTH - WARNING_THRESHOLD && (
              <p className="text-xs text-orange-500 mt-1">
                {name.length === MAX_NAME_LENGTH 
                  ? 'Достигнут лимит символов' 
                  : `Осталось ${MAX_NAME_LENGTH - name.length} символов`}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Мышечные группы *
              </label>
              <button 
                type="button"
                onClick={addMuscle}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить группу</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {muscles.map((m, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <select
                      value={m.muscle}
                      onChange={(e) => handleMuscleChange(index, 'muscle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Выберите группу мышц</option>
                      {MUSCLES.map(muscle => (
                        <option key={muscle} value={muscle}>{muscle}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={m.coeff}
                      onChange={(e) => handleMuscleChange(index, 'coeff', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      required
                      disabled={index === 0 && muscles.length === 1}
                    />
                  </div>
                  <div className="col-span-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeMuscle(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Сумма коэффициентов должна быть равна 1.0. Основная группа мышц по умолчанию имеет коэффициент 1.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Создание...' : 'Создать упражнение'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExerciseCreate