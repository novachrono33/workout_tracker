// frontend/src/services/recommendationService.js
import { api } from './api'

export const recommendationsAPI = {
  getExerciseRecommendation: async (exerciseId, currentSets) => {
    return api.post(`/recommendations/exercise/${exerciseId}`, currentSets)
  },
  
  getWorkoutRecommendations: async (workoutId) => {
    return api.get(`/recommendations/workout/${workoutId}`)
  }
}