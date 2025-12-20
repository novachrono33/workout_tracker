import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/common/PrivateRoute'
import Layout from './components/common/Layout'
import Dashboard from './pages/Dashboard'
import ExerciseList from './pages/Exercises/ExerciseList'
import ExerciseCreate from './pages/Exercises/ExerciseCreate'
import ExerciseEdit from './pages/Exercises/ExerciseEdit'
import WorkoutList from './pages/Workouts/WorkoutList'
import WorkoutCreate from './pages/Workouts/WorkoutCreate'
import WorkoutDetail from './pages/Workouts/WorkoutDetail'
import WorkoutEdit from './pages/Workouts/WorkoutEdit'
import Analytics from './pages/Analytics/Analytics'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/exercises" element={
            <PrivateRoute>
              <Layout>
                <ExerciseList />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/exercises/create" element={
            <PrivateRoute>
              <Layout>
                <ExerciseCreate />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/exercises/:id/edit" element={
            <PrivateRoute>
              <Layout>
                <ExerciseEdit />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/workouts" element={
            <PrivateRoute>
              <Layout>
                <WorkoutList />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/workouts/create" element={
            <PrivateRoute>
              <Layout>
                <WorkoutCreate />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/workouts/:id" element={
            <PrivateRoute>
              <Layout>
                <WorkoutDetail />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/workouts/:id/edit" element={
            <PrivateRoute>
              <Layout>
                <WorkoutEdit />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/analytics" element={
            <PrivateRoute>
              <Layout>
                <Analytics />
              </Layout>
            </PrivateRoute>
          } />

          {/* Redirect to login for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App