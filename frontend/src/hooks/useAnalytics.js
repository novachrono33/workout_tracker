import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'

export const useAnalytics = (workoutId = null) => {
  const [analytics, setAnalytics] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWorkoutAnalytics = async (id) => {
    setLoading(true)
    try {
      const data = await analyticsService.getWorkoutAnalytics(id)
      setAnalytics(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async (days = 30) => {
    setLoading(true)
    try {
      const data = await analyticsService.getUserProgress(days)
      setProgress(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch progress')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (workoutId) {
      fetchWorkoutAnalytics(workoutId)
    }
  }, [workoutId])

  return {
    analytics,
    progress,
    loading,
    error,
    fetchWorkoutAnalytics,
    fetchUserProgress,
    refreshProgress: fetchUserProgress
  }
}