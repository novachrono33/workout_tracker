// frontend/src/hooks/useAIRec.js
import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { recommendationsAPI } from '../services/api'

export const useAIRec = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const { user } = useAuth()

  const getRecommendation = useCallback(async (exerciseId, currentSets) => {
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await recommendationsAPI.getExerciseRecommendation(
        exerciseId,
        currentSets
      )
      
      if (response.data.success) {
        setRecommendation(response.data.data)
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Ошибка получения рекомендации')
      }
    } catch (err) {
      let errorMessage = 'Неизвестная ошибка'
      
      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.'
        } else {
          errorMessage = err.response.data?.detail || err.response.statusText || 'Ошибка запроса'
        }
      } else if (err.request) {
        errorMessage = 'Не удалось подключиться к серверу'
      } else {
        errorMessage = err.message || 'Неизвестная ошибка'
      }
      
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user])

  const clearRecommendation = useCallback(() => {
    setRecommendation(null)
    setError(null)
  }, [])

  return {
    loading,
    error,
    recommendation,
    getRecommendation,
    clearRecommendation
  }
}