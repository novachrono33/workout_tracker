import React, { useState, useEffect } from 'react'
import { Play, Pause, Square, AlertTriangle } from 'lucide-react'

const Timer = ({ onDurationChange, initialDuration = 0 }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(initialDuration * 60) // в секундах
  const [startTime, setStartTime] = useState(null)
  const [pausedTime, setPausedTime] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    let interval = null

    if (isRunning) {
      interval = setInterval(() => {
        const currentTime = Math.floor((Date.now() - startTime) / 1000) + pausedTime
        setTime(currentTime)
        if (onDurationChange) {
          onDurationChange(Math.floor(currentTime / 60)) // передаем в минутах
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, startTime, pausedTime, onDurationChange])

  const startTimer = () => {
    if (!isRunning) {
      setStartTime(Date.now() - pausedTime * 1000)
      setIsRunning(true)
    }
  }

  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false)
      setPausedTime(time)
    }
  }

  const resetTimer = () => {
    setShowResetConfirm(true)
  }

  const confirmReset = () => {
    setIsRunning(false)
    setTime(0)
    setPausedTime(0)
    setStartTime(null)
    if (onDurationChange) {
      onDurationChange(0)
    }
    setShowResetConfirm(false)
  }

  const cancelReset = () => {
    setShowResetConfirm(false)
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Модальное окно подтверждения сброса */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900">Сбросить таймер?</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Вы уверены, что хотите сбросить время тренировки? Это действие нельзя отменить.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelReset}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                >
                  Сбросить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3 bg-blue-50 px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-mono font-medium text-blue-800 bg-white px-2 py-1 rounded border">
            {formatTime(time)}
          </div>
          
          <div className="flex items-center space-x-1">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                title="Запустить таймер"
              >
                <Play className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                title="Приостановить таймер"
              >
                <Pause className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={resetTimer}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
              title="Сбросить таймер"
            >
              <Square className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-blue-600 font-medium">
          {isRunning ? 'Идет тренировка' : time > 0 ? 'Таймер на паузе' : 'Таймер остановлен'}
        </div>
      </div>
    </>
  )
}

export default Timer