import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'

export const useAnalytics = (workoutId = null) => {
  const [analytics, setAnalytics] = useState(null)
  const [progress, setProgress] = useState({
    period: '30 days',
    total_workouts: 0,
    total_volume_kg: 0,
    avg_volume_per_workout: 0,
    weekly_progress: [],
    exercise_progress: {},
    muscle_group_distribution: {},
    consistency_score: 0,
    strength_progress: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWorkoutAnalytics = async (id) => {
    setLoading(true)
    try {
      const data = await analyticsService.getWorkoutAnalytics(id)
      setAnalytics(data)
      setError(null)
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
      // Обеспечиваем наличие всех полей
      const formattedData = {
        period: data.period || `${days} days`,
        total_workouts: data.total_workouts || 0,
        total_volume_kg: data.total_volume_kg || 0,
        avg_volume_per_workout: data.avg_volume_per_workout || 0,
        weekly_progress: data.weekly_progress || [],
        exercise_progress: data.exercise_progress || {},
        muscle_group_distribution: data.muscle_group_distribution || {},
        consistency_score: data.consistency_score || 0,
        strength_progress: data.strength_progress || {}
      }
      setProgress(formattedData)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch progress')
      // Устанавливаем значения по умолчанию при ошибке
      setProgress({
        period: `${days} days`,
        total_workouts: 0,
        total_volume_kg: 0,
        avg_volume_per_workout: 0,
        weekly_progress: [],
        exercise_progress: {},
        muscle_group_distribution: {},
        consistency_score: 0,
        strength_progress: {}
      })
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