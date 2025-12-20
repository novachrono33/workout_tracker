// frontend/src/services/api.js
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor для добавления токена
api.interceptors.request.use((config) => {
  // Пробуем оба возможных ключа, где может храниться токен
  const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log(`🔐 Token found: ${token.substring(0, 20)}...`)
  } else {
    console.warn('⚠️ No auth token found in localStorage')
  }
  return config
})

// Response interceptor для обработки ошибок аутентификации
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error(`❌ API Error ${error.response?.status}:`, {
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    })
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized, redirecting to login')
      // Удаляем оба возможных ключа токена
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (formData) => api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
}

export const exercisesAPI = {
  getAll: () => api.get('/exercises'),
  create: (exerciseData) => api.post('/exercises', exerciseData),
  getById: (id) => api.get(`/exercises/${id}`),
  update: (id, exerciseData) => api.patch(`/exercises/${id}`, exerciseData),
  delete: (id) => api.delete(`/exercises/${id}`),
}

export const workoutsAPI = {
  getAll: () => api.get('/workouts'),
  create: (workoutData) => api.post('/workouts', workoutData),
  getById: (id) => api.get(`/workouts/${id}`),
  update: (id, workoutData) => api.put(`/workouts/${id}`, workoutData),
  delete: (id) => api.delete(`/workouts/${id}`),
  addExercise: (workoutId, exerciseData) => 
    api.post(`/workouts/${workoutId}/exercises`, exerciseData),
  updateExerciseOrder: (workoutId, exerciseId, newOrder) =>
    api.put(`/workouts/${workoutId}/exercises/${exerciseId}/order`, { newOrder }),
}

export const equipmentAPI = {
  getAll: () => api.get('/equipment'),
  create: (equipmentData) => api.post('/equipment', equipmentData),
}

export const recommendationsAPI = {
  getExerciseRecommendation: (exerciseId, currentSets) =>
    api.post(`/recommendations/exercise/${exerciseId}`, currentSets),
}

export const analyticsAPI = {
  getWorkoutAnalytics: (workoutId) => api.get(`/analytics/workout/${workoutId}`),
  getUserProgress: (days = 30) => api.get(`/analytics/progress?days=${days}`),
  getStrengthProgress: (days = 30) => api.get(`/analytics/strength-progress?days=${days}`),
  createAnalyticsSnapshot: () => api.post('/analytics/snapshot'),
}

export default api