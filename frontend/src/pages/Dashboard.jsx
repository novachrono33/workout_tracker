import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWorkouts } from '../hooks/useWorkouts'
import { useAnalytics } from '../hooks/useAnalytics'
import { Activity, TrendingUp, Calendar, Target } from 'lucide-react'

const Dashboard = () => {
  const { workouts } = useWorkouts()
  const { progress, fetchUserProgress } = useAnalytics()
  const [stats, setStats] = useState([])

  useEffect(() => {
    fetchUserProgress(7)
  }, [])

  useEffect(() => {
    if (progress) {
      setStats([
        { 
          label: 'Total Workouts', 
          value: progress.total_workouts?.toString() || '0', 
          icon: Activity, 
          change: '+0' 
        },
        { 
          label: 'Current Streak', 
          value: '5 days', 
          icon: TrendingUp, 
          change: '+1' 
        },
        { 
          label: 'This Month', 
          value: `${progress.weekly_progress?.[0]?.workouts || 0} workouts`, 
          icon: Calendar, 
          change: '+3' 
        },
        { 
          label: 'Goals Completed', 
          value: '75%', 
          icon: Target, 
          change: '+5%' 
        },
      ])
    } else {
      setStats([
        { label: 'Total Workouts', value: '0', icon: Activity, change: '+0' },
        { label: 'Current Streak', value: '0 days', icon: TrendingUp, change: '+0' },
        { label: 'This Month', value: '0 workouts', icon: Calendar, change: '+0' },
        { label: 'Goals Completed', value: '0%', icon: Target, change: '+0%' },
      ])
    }
  }, [progress])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last week</p>
                </div>
                <Icon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/workouts/create"
          className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start New Workout</h3>
          <p className="text-gray-600">Begin a new training session with your favorite exercises</p>
        </Link>

        <Link
          to="/exercises"
          className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Exercises</h3>
          <p className="text-gray-600">Explore exercise library and add new movements</p>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard