// frontend\src\hooks\useRecommendations.js
import { useState } from 'react'
import { workoutService } from '../services/workoutService'

export const useRecommendations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getRecommendation = async (exerciseId, currentWorkoutData) => {
    setLoading(true)
    setError(null)
    
    try {
      const recommendation = await workoutService.getRecommendation(exerciseId, currentWorkoutData)
      return recommendation
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get recommendation')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    getRecommendation,
    loading,
    error
  }
}