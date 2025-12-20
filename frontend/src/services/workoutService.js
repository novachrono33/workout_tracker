import { workoutsAPI } from './api'

export const workoutService = {
  async getWorkouts() {
    console.log('🔄 workoutService.getWorkouts() called')
    const response = await workoutsAPI.getAll()
    console.log('✅ workoutService.getWorkouts() response:', response.data)
    return response.data.data
  },

  async createWorkout(workoutData) {
    console.log('🔄 workoutService.createWorkout() called:', workoutData)
    const response = await workoutsAPI.create(workoutData)
    console.log('✅ workoutService.createWorkout() response:', response.data)
    return response.data.data
  },

  async getWorkout(id) {
    console.log(`🔄 workoutService.getWorkout(${id}) called`)
    const response = await workoutsAPI.getById(id)
    console.log(`✅ workoutService.getWorkout(${id}) response:`, response.data)
    return response.data.data
  },

  async updateWorkout(id, workoutData) {
    console.log(`🔄 workoutService.updateWorkout(${id}) called:`, workoutData)
    const response = await workoutsAPI.update(id, workoutData)
    console.log(`✅ workoutService.updateWorkout(${id}) response:`, response.data)
    return response.data.data
  },

  async deleteWorkout(id) {
    console.log(`🔄 workoutService.deleteWorkout(${id}) called`)
    const response = await workoutsAPI.delete(id)
    console.log(`✅ workoutService.deleteWorkout(${id}) response:`, response.data)
    return response.data
  },

  async addExerciseToWorkout(workoutId, exerciseData) {
    console.log(`🔄 workoutService.addExerciseToWorkout(${workoutId}) called:`, exerciseData)
    const response = await workoutsAPI.addExercise(workoutId, exerciseData)
    console.log(`✅ workoutService.addExerciseToWorkout(${workoutId}) response:`, response.data)
    return response.data.data
  },

  async updateExerciseOrder(workoutId, exerciseId, newOrder) {
    console.log(`🔄 workoutService.updateExerciseOrder(${workoutId}, ${exerciseId}, ${newOrder}) called`)
    const response = await workoutsAPI.updateExerciseOrder(workoutId, exerciseId, newOrder)
    console.log(`✅ workoutService.updateExerciseOrder response:`, response.data)
    return response.data
  },

  async getRecommendation(exerciseId, currentWorkoutData) {
    console.log(`🔄 workoutService.getRecommendation(${exerciseId}) called:`, currentWorkoutData)
    const response = await workoutsAPI.getExerciseRecommendation(exerciseId, currentWorkoutData)
    console.log(`✅ workoutService.getRecommendation response:`, response.data)
    return response.data.data
  }

  // УБРАЛИ: метод calculateWorkoutVolume - теперь вычисляется на бэкенде
}