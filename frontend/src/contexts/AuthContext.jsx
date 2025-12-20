import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data.data)
    } catch (error) {
      console.error('Auth check failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setError(null)
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await authAPI.login(formData)
      const { access_token } = response.data.data
      
      localStorage.setItem('auth_token', access_token)
      await checkAuth()
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await authAPI.register(userData)
      const { access_token } = response.data.data
      
      localStorage.setItem('auth_token', access_token)
      await checkAuth()
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}