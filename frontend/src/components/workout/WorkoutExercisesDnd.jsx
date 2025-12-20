import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import ExerciseCard from './ExerciseCard';

// Sortable элемент упражнения
const SortableExercise = ({ 
  exercise, 
  index, 
  onUpdate, 
  onRemove, 
  onGetRecommendation 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: exercise.tempId || exercise.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border shadow-sm ${
        isDragging ? 'opacity-50 shadow-lg border-blue-500' : 'opacity-100 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <div 
          className="flex items-center space-x-2 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Упражнение {index + 1}
          </span>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
          title="Удалить упражнение"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <ExerciseCard
          exercise={exercise}
          index={index}
          onUpdate={(updated) => onUpdate(index, updated)}
          onRemove={() => onRemove(index)}
          onGetRecommendation={onGetRecommendation}
        />
      </div>
    </div>
  );
};

// DragOverlay компонент
const ExerciseDragOverlay = ({ exercise, index }) => (
  <div className="bg-white rounded-lg border-2 border-blue-500 shadow-xl w-full">
    <div className="flex items-center justify-between p-3 border-b bg-blue-50 rounded-t-lg">
      <div className="flex items-center space-x-2">
        <GripVertical className="h-5 w-5 text-blue-500" />
        <span className="text-sm font-medium text-blue-700">
          Упражнение {index + 1}
        </span>
      </div>
      <div className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
        Перетаскивается
      </div>
    </div>
    
    <div className="p-3">
      <ExerciseCard
        exercise={exercise}
        index={index}
        onUpdate={() => {}}
        onRemove={() => {}}
        onGetRecommendation={() => {}}
        isDragging={true}
      />
    </div>
  </div>
);

// DropZone для добавления из библиотеки
const DropZone = ({ onDrop, position, isVisible = true }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (isOver) setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const dragData = JSON.parse(data);
        if (dragData.type === 'exercise-from-library') {
          onDrop(dragData.exercise);
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }
  };

  const getZoneContent = () => {
    switch (position) {
      case 'start':
        return {
          text: isOver ? 'Отпустите чтобы добавить в начало' : 'Перетащите сюда чтобы добавить в начало',
          className: `min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-300'
          }`
        };
      case 'between':
        return {
          text: '',
          // Большая невидимая зона, но компактный визуальный маркер
          className: `h-12 -my-2 transition-colors flex items-center justify-center relative`
        };
      case 'end':
        return {
          text: isOver ? 'Отпустите чтобы добавить в конец' : 'Перетащите сюда чтобы добавить в конец',
          className: `min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-300'
          }`
        };
      case 'empty':
        return {
          text: isOver ? 'Отпустите чтобы добавить упражнение' : 'Перетащите упражнение сюда или нажмите +',
          className: `min-h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-300'
          }`
        };
      default:
        return {
          text: isOver ? 'Отпустите чтобы добавить упражнение' : 'Перетащите упражнение сюда',
          className: `min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
            isOver ? 'border-blue-500 bg-blue-50 border-solid' : 'border-gray-300'
          }`
        };
    }
  };

  const zoneContent = getZoneContent();

  if (!isVisible) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={zoneContent.className}
    >
      {position === 'between' && (
        <div className={`absolute inset-x-4 transition-all duration-200 ${
          isOver ? 'h-1 bg-blue-500 rounded-full' : 'h-0'
        }`} />
      )}
      {position !== 'between' && (
        <div className="text-center">
          <p className={`text-sm ${isOver ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            {zoneContent.text}
          </p>
          {position === 'empty' && (
            <p className="text-xs text-gray-400 mt-2">
              Начните создавать свою тренировку
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const WorkoutExercisesDnd = ({ 
  exercises, 
  onUpdateExercise, 
  onRemoveExercise, 
  onReorderExercises,
  onGetRecommendation 
}) => {
  const [activeId, setActiveId] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    const exercise = exercises.find(ex => (ex.tempId || ex.id) === active.id);
    if (exercise) {
      setActiveExercise(exercise);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Перетаскивание внутри активной зоны
    if (over && active.id !== over.id) {
      const oldIndex = exercises.findIndex(item => (item.tempId || item.id) === active.id);
      const newIndex = exercises.findIndex(item => (item.tempId || item.id) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedExercises = arrayMove(exercises, oldIndex, newIndex);
        onReorderExercises(reorderedExercises.map((exercise, index) => ({
          ...exercise,
          order: index
        })));
      }
    }

    setActiveId(null);
    setActiveExercise(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveExercise(null);
  };

  // Обработчик добавления упражнения из библиотеки
  const handleAddExercise = (exerciseData, insertIndex = exercises.length) => {
    const newExercise = {
      exercise_id: exerciseData.id,
      exercise: exerciseData,
      tempId: `exercise-${Date.now()}-${Math.random()}`,
      sets: Array.from({ length: exerciseData.default_sets || 3 }, (_, i) => ({
        set_number: i + 1,
        weight_kg: 0,
        reps: exerciseData.default_reps || 10,
        rir: 2
      }))
    };

    const updatedExercises = [...exercises];
    updatedExercises.splice(insertIndex, 0, newExercise);
    
    const reorderedExercises = updatedExercises.map((exercise, index) => ({
      ...exercise,
      order: index
    }));
    
    onReorderExercises(reorderedExercises);
  };

  const activeIndex = activeExercise 
    ? exercises.findIndex(ex => (ex.tempId || ex.id) === activeId) || 0
    : 0;

  // Если нет упражнений - показываем только одну большую зону
  if (exercises.length === 0) {
    return (
      <DropZone 
        onDrop={(exercise) => handleAddExercise(exercise, 0)}
        position="empty"
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Верхняя DropZone для добавления в начало */}
      <DropZone 
        onDrop={(exercise) => handleAddExercise(exercise, 0)}
        position="start"
      />
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        autoScroll={false}
      >
        <SortableContext 
          items={exercises.map(ex => ex.tempId || ex.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div key={exercise.tempId || exercise.id}>
                <SortableExercise
                  exercise={exercise}
                  index={index}
                  onUpdate={onUpdateExercise}
                  onRemove={onRemoveExercise}
                  onGetRecommendation={onGetRecommendation}
                />
                
                {/* DropZone между упражнениями - большая невидимая зона, компактный маркер */}
                {index < exercises.length - 1 && (
                  <DropZone 
                    onDrop={(exercise) => handleAddExercise(exercise, index + 1)}
                    position="between"
                  />
                )}
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeExercise ? (
            <ExerciseDragOverlay 
              exercise={activeExercise} 
              index={activeIndex}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Нижняя DropZone для добавления в конец */}
      <DropZone 
        onDrop={(exercise) => handleAddExercise(exercise, exercises.length)}
        position="end"
      />
    </div>
  );
};

export default WorkoutExercisesDnd;