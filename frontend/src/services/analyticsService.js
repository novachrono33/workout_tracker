import { analyticsAPI } from './api'

export const analyticsService = {
  async getWorkoutAnalytics(workoutId) {
    const response = await analyticsAPI.getWorkoutAnalytics(workoutId)
    return response.data.data
  },

  async getUserProgress(days = 30) {
    const response = await analyticsAPI.getUserProgress(days)
    return response.data.data
  },

  async getStrengthProgress(days = 30) {
    const response = await analyticsAPI.getStrengthProgress(days)
    return response.data.data
  },

  async createAnalyticsSnapshot() {
    const response = await analyticsAPI.createAnalyticsSnapshot()
    return response.data.data
  },

  // Вспомогательные функции для расчета аналитики на клиенте
  calculateWeeklyProgress(workouts) {
    const weeklyData = {}
    
    workouts.forEach(workout => {
      const week = this.getWeekNumber(workout.date)
      if (!weeklyData[week]) {
        weeklyData[week] = { volume: 0, workouts: 0, sets: 0 }
      }
      weeklyData[week].volume += workout.total_volume || 0
      weeklyData[week].workouts += 1
      weeklyData[week].sets += workout.exercises?.reduce((total, ex) => 
        total + (ex.sets?.length || 0), 0
      ) || 0
    })

    return weeklyData
  },

  getWeekNumber(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${weekNo}`
  },

  calculateMuscleGroupDistribution(workouts) {
    const distribution = {}
    
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const muscleGroup = exercise.exercise?.muscle_group || 'Other'
        if (!distribution[muscleGroup]) {
          distribution[muscleGroup] = { count: 0, volume: 0 }
        }
        distribution[muscleGroup].count += 1
        distribution[muscleGroup].volume += exercise.sets?.reduce((total, set) => 
          total + (set.weight_kg * set.reps), 0
        ) || 0
      })
    })

    return distribution
  }
}