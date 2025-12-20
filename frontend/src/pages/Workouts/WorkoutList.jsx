import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkouts } from '../../hooks/useWorkouts'
import { Calendar, Clock, Activity, Plus } from 'lucide-react'

const WorkoutList = () => {
  const { workouts, loading, error } = useWorkouts()
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 })

  // Функция для форматирования заметок (сохраняет переносы строк)
  const formatNotes = (notes, maxLength = 100) => {
    if (!notes) return ''
    
    // Сохраняем переносы строк, но ограничиваем общую длину
    if (notes.length <= maxLength) {
      return notes
    }
    
    // Находим последний пробел перед максимальной длиной
    const truncated = notes.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > maxLength * 0.7) { // Если есть разумное место для обрезки
      return truncated.substring(0, lastSpace) + '...'
    }
    
    return truncated + '...'
  }

  const showTooltip = (e, content) => {
    const element = e.currentTarget;
    const isTruncated = element.scrollWidth > element.clientWidth || 
                       element.scrollHeight > element.clientHeight ||
                       element.textContent.includes('...');
    
    if (isTruncated || (content && content.length > 100)) {
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      setTooltip({
        visible: true,
        content,
        x: rect.right + 10,
        y: rect.top + scrollTop + (rect.height / 2)
      });
    }
  }

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 })
  }

  // Функция для ограничения строк в тултипе (сохраняет переносы)
  const truncateTooltipContent = (content, maxLines = 10) => {
    if (!content) return '';
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
      return content;
    }
    return lines.slice(0, maxLines).join('\n') + '\n...';
  };

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
          <p>Error loading workouts: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Кастомный тултип */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg shadow-xl border border-gray-200 max-w-xs break-words whitespace-pre-wrap"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateY(-50%)',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {truncateTooltipContent(tooltip.content)}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Workouts</h1>
          <p className="text-gray-600 mt-2">Track and manage your training sessions</p>
        </div>
        <Link
          to="/workouts/create"
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Workout</span>
        </Link>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
          <p className="text-gray-600 mb-6">Start your fitness journey by creating your first workout</p>
          <Link
            to="/workouts/create"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Workout
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              to={`/workouts/${workout.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex-1">
                {/* Заголовок */}
                <div className="mb-3">
                  <h3 
                    className="text-lg font-semibold text-gray-900 line-clamp-1"
                    onMouseEnter={(e) => showTooltip(e, workout.name)}
                    onMouseMove={(e) => showTooltip(e, workout.name)}
                    onMouseLeave={hideTooltip}
                  >
                    {workout.name}
                  </h3>
                </div>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(workout.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  {workout.duration_minutes && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{workout.duration_minutes} minutes</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>{workout.exercises?.length || 0} exercises</span>
                  </div>
                </div>

                {/* Заметки с сохранением форматирования и ограничением по высоте */}
                {workout.notes && (
                  <div className="mt-4">
                    <p 
                      className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3 max-h-[4.5em] overflow-hidden"
                      onMouseEnter={(e) => showTooltip(e, workout.notes)}
                      onMouseMove={(e) => showTooltip(e, workout.notes)}
                      onMouseLeave={hideTooltip}
                    >
                      {formatNotes(workout.notes)}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Volume</span>
                    <span className="font-medium text-gray-900">
                      {workout.total_volume ? `${workout.total_volume} kg` : 'Not calculated'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkoutList