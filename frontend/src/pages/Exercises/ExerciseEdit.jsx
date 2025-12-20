import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExercises } from '../../hooks/useExercises'
import { ArrowLeft, Trash2, Plus } from 'lucide-react'

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

const ExerciseEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { exercises, updateExercise, deleteExercise } = useExercises()
  const [name, setName] = useState('')
  const [muscles, setMuscles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const exercise = exercises.find(ex => ex.id === parseInt(id))
    if (exercise) {
      setName(exercise.name)
      setMuscles(Object.entries(exercise.muscle_coefficients || {}).map(([muscle, coeff]) => ({
        muscle,
        coeff
      })))
      setLoading(false)
    } else {
      setError('Упражнение не найдено')
      setLoading(false)
    }
  }, [id, exercises])

  useEffect(() => {
    if (!loading) {
      const total = muscles.reduce((sum, m) => sum + (parseFloat(m.coeff) || 0), 0)
      if (Math.abs(total - 1) > 0.001) {
        setError(`Сумма коэффициентов должна быть равна 1. Текущая сумма: ${total.toFixed(2)}`)
      } else {
        setError(null)
      }
    }
  }, [muscles, loading])

  const handleNameChange = (e) => {
    const value = e.target.value
    if (value.length <= MAX_NAME_LENGTH) {
      setName(value)
    }
  }

  const getCharCountColor = () => {
    const remaining = MAX_NAME_LENGTH - name.length
    if (remaining === 0) return 'text-red-600 font-semibold'
    if (remaining <= WARNING_THRESHOLD) return 'text-orange-500'
    return 'text-gray-500'
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
    const updated = muscles.filter((_, i) => i !== index)
    setMuscles(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (error) return
    
    const muscle_coefficients = muscles.reduce((obj, m) => {
      if (m.muscle && m.coeff > 0) {
        obj[m.muscle] = parseFloat(m.coeff)
      }
      return obj
    }, {})
    
    const formData = {
      name,
      muscle_coefficients
    }
    
    setLoading(true)
    try {
      await updateExercise(id, formData)
      navigate('/exercises')
    } catch (err) {
      setError(err.message || 'Failed to update exercise')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить это упражнение?')) {
      setDeleting(true)
      try {
        await deleteExercise(id)
        navigate('/exercises')
      } catch (err) {
        setError(err.message || 'Failed to delete exercise')
      } finally {
        setDeleting(false)
      }
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center py-12">Загрузка...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/exercises')}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Exercises</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Редактировать упражнение</h1>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            <Trash2 className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Название упражнения
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
                Мышечные группы
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => removeMuscle(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={muscles.length === 1}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Сумма коэффициентов должна быть равна 1.0.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || error}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExerciseEdit