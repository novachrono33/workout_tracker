import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useExercises } from '../../hooks/useExercises'
import ConfirmModal from '../../components/common/ConfirmModal'
import { Dumbbell, Plus, Search, Edit2, Trash2 } from 'lucide-react'

const MUSCLES = [
  'Грудь',
  'Дельты',
  'Задняя дельта',
  'Трицепс',
  'Бицепс',
  'Предплечья',
  'Шея',
  'Спина',
  'Широчайшие',
  'Поясница',
  'Трапеция',
  'Пресс',
  'Ягодицы',
  'Квадрицепсы',
  'Бицепс бедра',
  'Икры'
]

const ExerciseList = () => {
  const navigate = useNavigate()
  const { exercises, loading, error, deleteExercise } = useExercises()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('')
  const [exerciseToDelete, setExerciseToDelete] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 })
  const titleRefs = useRef({})

  // Функция для проверки, нужно ли обрезать текст
  const checkTruncation = () => {
    const newTruncatedStates = {}
    Object.keys(titleRefs.current).forEach(id => {
      const element = titleRefs.current[id]
      if (element) {
        const isTruncated = element.scrollHeight > element.clientHeight || 
                           element.scrollWidth > element.clientWidth
        newTruncatedStates[id] = isTruncated
      }
    })
    return newTruncatedStates
  }

  const [truncatedStates, setTruncatedStates] = useState({})

  useEffect(() => {
    // Проверяем обрезку после рендера и после резкого изменения данных
    const timeoutId = setTimeout(() => {
      setTruncatedStates(checkTruncation())
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [exercises, searchTerm, selectedMuscle])

  // Обработчик скролла для скрытия тултипа
  useEffect(() => {
    const handleScroll = () => {
      hideTooltip();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showTooltip = (e, content, exerciseId) => {
    if (truncatedStates[exerciseId]) {
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Правильное позиционирование с учетом скролла (как в ExerciseLibrary)
      const x = rect.right + 10;
      const y = rect.top + (rect.height / 2);
      
      setTooltip({
        visible: true,
        content: content,
        x: x,
        y: y
      });
    }
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  // Функция для ограничения строк в тултипе (сохраняет переносы)
  const truncateTooltipContent = (content, maxLines = 10) => {
    if (!content) return '';
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
      return content;
    }
    return lines.slice(0, maxLines).join('\n') + '\n...';
  };

  // Функция для форматирования длинных названий в модальном окне
  const formatLongName = (name, maxLength = 60) => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    
    // Находим последний пробел перед maxLength
    const lastSpaceIndex = name.lastIndexOf(' ', maxLength);
    const breakIndex = lastSpaceIndex > maxLength * 0.7 ? lastSpaceIndex : maxLength;
    
    return name.substring(0, breakIndex) + '\n' + name.substring(breakIndex).trim();
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
          <p>Ошибка загрузки упражнений: {error}</p>
        </div>
      </div>
    )
  }

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedMuscle || (ex.muscle_coefficients && ex.muscle_coefficients[selectedMuscle] > 0))
  )

  const handleEdit = (id) => {
    navigate(`/exercises/${id}/edit`)
  }

  const handleDeleteClick = (exercise) => {
    setExerciseToDelete(exercise)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return
    
    try {
      setDeletingExerciseId(exerciseToDelete.id)
      setTimeout(async () => {
        await deleteExercise(exerciseToDelete.id)
        setDeletingExerciseId(null)
      }, 300)
      
      setIsDeleteModalOpen(false)
      setExerciseToDelete(null)
    } catch (err) {
      setDeletingExerciseId(null)
      alert('Ошибка удаления: ' + err.message)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setExerciseToDelete(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Кастомный тултип - справа от карточки с центрированием по вертикали */}
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
          <h1 className="text-3xl font-bold text-gray-900">Мои упражнения</h1>
          <p className="text-gray-600 mt-2">Управление списком упражнений</p>
        </div>
        <Link
          to="/exercises/create"
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Новое упражнение</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все группы мышц</option>
            {MUSCLES.map(muscle => (
              <option key={muscle} value={muscle}>{muscle}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет упражнений</h3>
          <p className="text-gray-600 mb-6">Добавьте ваше первое упражнение</p>
          <Link
            to="/exercises/create"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать упражнение
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div 
              key={exercise.id}
              className={`
                bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-300
                ${deletingExerciseId === exercise.id ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <Dumbbell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 
                      ref={el => titleRefs.current[exercise.id] = el}
                      className="font-semibold text-gray-900 leading-tight"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => showTooltip(e, exercise.name, exercise.id)}
                      onMouseMove={(e) => showTooltip(e, exercise.name, exercise.id)}
                      onMouseLeave={hideTooltip}
                    >
                      {exercise.name}
                    </h3>
                  </div>
                </div>
                
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(exercise.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(exercise)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {exercise.muscle_coefficients && Object.keys(exercise.muscle_coefficients).length > 0 && (
                <div className="space-y-1 text-sm text-gray-600">
                  <span className="font-medium">Мышечные группы:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(exercise.muscle_coefficients)
                      .filter(([_, coeff]) => coeff > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([muscle, coeff]) => (
                        <span 
                          key={muscle} 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {muscle}: {coeff.toFixed(1)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Удаление упражнения"
        message={
          <div className="text-center">
            <p className="mb-4">
              Вы уверены, что хотите удалить упражнение?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-full">
              <p className="text-red-800 font-medium break-words whitespace-pre-line text-sm">
                {exerciseToDelete?.name && formatLongName(exerciseToDelete.name)}
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              Это действие нельзя отменить.
            </p>
          </div>
        }
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </div>
  )
}

export default ExerciseList