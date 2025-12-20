import { useState, useEffect } from 'react'
import { workoutService } from '../services/workoutService'

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWorkouts = async () => {
    console.log('🔄 useWorkouts: Starting to fetch workouts...')
    setLoading(true)
    setError(null)
    try {
      // ИСПРАВЛЕНО: используем getWorkouts() вместо getAllWorkouts()
      const data = await workoutService.getWorkouts()
      console.log('✅ useWorkouts: Data received:', data)
      setWorkouts(data || [])
    } catch (err) {
      console.error('❌ useWorkouts: Failed to fetch workouts:', err)
      console.error('📊 Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      setError(err.response?.data?.detail || err.message || 'Failed to fetch workouts')
      setWorkouts([])
    } finally {
      setLoading(false)
    }
  }

  const createWorkout = async (workoutData) => {
    setError(null)
    try {
      const newWorkout = await workoutService.createWorkout(workoutData)
      setWorkouts(prev => [...prev, newWorkout])
      return newWorkout
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create workout')
      throw err
    }
  }

  useEffect(() => {
    fetchWorkouts()
  }, [])

  return {
    workouts,
    loading,
    error,
    createWorkout,
    refreshWorkouts: fetchWorkouts
  }
}