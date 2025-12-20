import React, { useState, useEffect } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { analyticsService } from '../../services/analyticsService'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar, 
  Activity,
  Dumbbell,
  Clock
} from 'lucide-react'

const Analytics = () => {
  const { progress, loading, error, fetchUserProgress } = useAnalytics()
  const [timeRange, setTimeRange] = useState(30)
  const [strengthProgress, setStrengthProgress] = useState(null)

  useEffect(() => {
    fetchUserProgress(timeRange)
    loadStrengthProgress()
  }, [timeRange])

  const loadStrengthProgress = async () => {
    try {
      const data = await analyticsService.getStrengthProgress(timeRange)
      setStrengthProgress(data)
    } catch (err) {
      console.error('Failed to load strength progress:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg max-w-md mx-auto">
          <p>Error loading analytics: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Track your progress and performance</p>
        
        <div className="flex space-x-4 mt-4">
          {[7, 30, 90, 365].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {progress ? (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Workouts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress.total_workouts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress.total_volume_kg?.toLocaleString()} kg
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Volume/Workout</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(progress.avg_volume_per_workout)?.toLocaleString()} kg
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Consistency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(progress.consistency_score)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Muscle Group Distribution */}
          {progress.muscle_group_distribution && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Muscle Group Distribution
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(progress.muscle_group_distribution).map(([muscle, percentage]) => (
                  <div key={muscle} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{muscle}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strength Progress */}
          {strengthProgress && Object.keys(strengthProgress).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Strength Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(strengthProgress).map(([exercise, data]) => (
                  <div key={exercise} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{exercise}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best Weight:</span>
                        <span className="font-medium">{data.best_weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estimated 1RM:</span>
                        <span className="font-medium">{data.estimated_1rm} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(data.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Progress */}
          {progress.weekly_progress && progress.weekly_progress.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Weekly Progress
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Week
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Workouts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Volume
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Avg Volume/Workout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {progress.weekly_progress.map((week, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {week.week}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {week.workouts}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {Math.round(week.volume).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {Math.round(week.avg_volume_per_workout).toLocaleString()} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-600">
            Complete some workouts to see your analytics and progress
          </p>
        </div>
      )}
    </div>
  )
}

export default Analytics