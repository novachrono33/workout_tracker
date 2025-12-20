import { useState, useEffect } from 'react'
import { exercisesAPI } from '../services/api'

export const useExercises = () => {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchExercises = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await exercisesAPI.getAll()
      setExercises(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch exercises')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  const createExercise = async (exerciseData) => {
    setError(null)
    try {
      const response = await exercisesAPI.create(exerciseData)
      const newExercise = response.data.data
      setExercises(prev => [...prev, newExercise])
      return newExercise
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create exercise'
      setError(errorMsg)
      throw new Error(errorMsg) // Бросаем ошибку для обработки в компоненте
    }
  }

  const updateExercise = async (id, exerciseData) => {
    setError(null)
    try {
      const response = await exercisesAPI.update(id, exerciseData)
      const updatedExercise = response.data.data
      setExercises(prev => 
        prev.map(ex => ex.id === parseInt(id) ? updatedExercise : ex)
      )
      return updatedExercise
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update exercise'
      setError(errorMsg)
      throw new Error(errorMsg) // Бросаем ошибку для обработки в компоненте
    }
  }

  const deleteExercise = async (id) => {
    setError(null)
    try {
      await exercisesAPI.delete(id)
      setExercises(prev => prev.filter(ex => ex.id !== parseInt(id)))
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete exercise'
      setError(errorMsg)
      throw new Error(errorMsg) // Бросаем ошибку для обработки в компоненте
    }
  }

  // Функция для очистки ошибки
  const clearError = () => {
    setError(null)
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  return {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    refreshExercises: fetchExercises,
    clearError // Добавляем функцию очистки ошибки
  }
}