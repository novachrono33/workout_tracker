import React, { useState, useMemo } from 'react';
import { Search, Filter, X, GripVertical } from 'lucide-react';
import { useExercises } from '../../hooks/useExercises';

const MUSCLES = [
  'Грудь', 'Дельты', 'Задняя дельта', 'Трицепс', 'Бицепс', 
  'Предплечья', 'Шея', 'Спина', 'Широчайшие', 'Поясница', 
  'Трапеция', 'Пресс', 'Ягодицы', 'Квадрицепсы', 'Бицепс бедра', 'Икры'
];

const ExerciseLibrary = ({ onExerciseSelect }) => {
  const { exercises, loading } = useExercises();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedMuscles.length === 0) return matchesSearch;
      
      const hasSelectedMuscles = selectedMuscles.some(muscle => {
        if (exercise.muscle_coefficients) {
          return exercise.muscle_coefficients[muscle] > 0;
        }
        return exercise.muscle_group === muscle;
      });
      
      return matchesSearch && hasSelectedMuscles;
    });
  }, [exercises, searchTerm, selectedMuscles]);

  const exercisesToShow = useMemo(() => {
    if (searchTerm || selectedMuscles.length > 0) {
      return filteredExercises;
    }
    return filteredExercises.slice(0, 8);
  }, [filteredExercises, searchTerm, selectedMuscles]);

  const toggleMuscle = (muscle) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const clearFilters = () => {
    setSelectedMuscles([]);
    setSearchTerm('');
  };

  // Нативный обработчик перетаскивания
  const handleDragStart = (e, exercise) => {
    const dragData = {
      type: 'exercise-from-library',
      exercise: {
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        muscle_coefficients: exercise.muscle_coefficients,
        equipment: exercise.equipment,
        default_sets: exercise.default_sets || 3,
        default_reps: exercise.default_reps || 10
      }
    };
    
    // Устанавливаем данные в двух форматах для надежности
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Разрешаем копирование
    e.dataTransfer.effectAllowed = 'copy';
    
    // Визуальная обратная связь
    e.currentTarget.style.opacity = '0.6';
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.cursor = 'grab';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Необходимо для возможности drop
  };

  const getPrimaryMuscleGroup = (exercise) => {
    if (exercise.muscle_group) {
      return exercise.muscle_group;
    }
    
    if (exercise.muscle_coefficients) {
      const entries = Object.entries(exercise.muscle_coefficients);
      if (entries.length > 0) {
        const primary = entries.reduce((max, [muscle, coeff]) => 
          coeff > max.coeff ? { muscle, coeff } : max, 
          { muscle: '', coeff: 0 }
        );
        return primary.muscle;
      }
    }
    
    return 'Не указана';
  };

  const showTooltip = (e, content) => {
    const element = e.currentTarget;
    const isTruncated = element.scrollWidth > element.clientWidth || 
                       element.scrollHeight > element.clientHeight ||
                       element.textContent.includes('...');
    
    if (isTruncated || content.length > 50) {
      const rect = element.getBoundingClientRect();
      
      // Правильное позиционирование с учетом скролла
      const x = rect.right + 10;
      const y = rect.top + (rect.height / 2);
      
      setTooltip({
        visible: true,
        content,
        x: x,
        y: y
      });
    }
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  // Функция для ограничения строк в тултипе
  const truncateTooltipContent = (content, maxLines = 10) => {
    if (!content) return '';
    const lines = content.split('\n');
    if (lines.length <= maxLines) {
      return content;
    }
    return lines.slice(0, maxLines).join('\n') + '\n...';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
      {/* Кастомный тултип */}
      {tooltip.visible && (
        <div 
          className="fixed z-50 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg shadow-xl border border-gray-200 max-w-xs break-words whitespace-pre-line"
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

      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-3">Библиотека упражнений</h3>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Поиск упражнений..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            <span>Группы мышц ({selectedMuscles.length})</span>
          </button>
          
          {(searchTerm || selectedMuscles.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50"
            >
              <X className="h-3 w-3" />
              <span>Очистить</span>
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="mb-2 text-sm font-medium text-gray-700">Группы мышц:</div>
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 gap-1">
              {MUSCLES.map(muscle => (
                <label key={muscle} className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMuscles.includes(muscle)}
                    onChange={() => toggleMuscle(muscle)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{muscle}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">Загрузка упражнений...</p>
          </div>
        ) : exercisesToShow.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Упражнения не найдены</p>
            {(searchTerm || selectedMuscles.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 text-xs mt-1"
              >
                Очистить фильтры
              </button>
            )}
          </div>
        ) : (
          <div>
            {exercisesToShow.map((exercise) => (
              <div
                key={exercise.id}
                draggable
                onDragStart={(e) => handleDragStart(e, exercise)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                className="cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors border-b"
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {/* Увеличенная зона наведения для названия упражнения */}
                      <div 
                        className="font-medium text-sm text-gray-900 truncate py-2 px-2 -mx-2 rounded hover:bg-gray-100 transition-colors"
                        onMouseEnter={(e) => showTooltip(e, exercise.name)}
                        onMouseMove={(e) => showTooltip(e, exercise.name)}
                        onMouseLeave={hideTooltip}
                      >
                        {exercise.name}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                        <span className="bg-gray-100 px-2 py-1 rounded truncate flex-shrink-0">
                          {getPrimaryMuscleGroup(exercise)}
                        </span>
                        {exercise.equipment && (
                          /* Увеличенная зона наведения для оборудования */
                          <div 
                            className="truncate text-gray-500 py-1 px-2 -mx-2 rounded hover:bg-gray-100 transition-colors"
                            onMouseEnter={(e) => showTooltip(e, exercise.equipment.name)}
                            onMouseMove={(e) => showTooltip(e, exercise.equipment.name)}
                            onMouseLeave={hideTooltip}
                          >
                            {exercise.equipment.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onExerciseSelect(exercise)}
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium ml-2 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-blue-50 transition-colors"
                    title="Добавить упражнение"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            
            {!searchTerm && selectedMuscles.length === 0 && filteredExercises.length > 8 && (
              <div className="p-3 text-center text-xs text-gray-500 bg-gray-50">
                Показано 8 из {filteredExercises.length} упражнений
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Показано: {exercisesToShow.length}</span>
          <span>Всего: {exercises.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;