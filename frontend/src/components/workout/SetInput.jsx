import React, { useState } from 'react'
import { Trash2, CheckCircle } from 'lucide-react'

const SetInput = ({ set, onUpdate, onRemove }) => {
  const [hasFocus, setHasFocus] = useState({
    weight: false,
    reps: false,
    rir: false
  })

  const [dirty, setDirty] = useState({
    weight: false,
    reps: false,
    rir: false
  })

  const [errors, setErrors] = useState({
    weight: '',
    reps: '',
    rir: ''
  })

  const [valid, setValid] = useState({
    weight: false,
    reps: false,
    rir: false
  })

  const validateField = (field, value) => {
    let isValid = true
    let message = ''

    switch (field) {
      case 'weight':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            isValid = false
            message = 'Вес не может быть отрицательным'
          } else if (value > 1000) {
            isValid = false
            message = 'Вес не может превышать 1000 кг'
          } else if (value > 0) {
            isValid = true
          }
        }
        break
      case 'reps':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            isValid = false
            message = 'Повторения не могут быть отрицательными'
          } else if (value > 100) {
            isValid = false
            message = 'Повторения не могут превышать 100'
          } else if (value > 0) {
            isValid = true
          }
        }
        break
      case 'rir':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            isValid = false
            message = 'RIR не может быть отрицательным'
          } else if (value > 10) {
            isValid = false
            message = 'RIR не может превышать 10'
          } else if (value >= 0) {
            isValid = true
          }
        }
        break
    }

    setErrors(prev => ({
      ...prev,
      [field]: message
    }))

    setValid(prev => ({
      ...prev,
      [field]: isValid && value !== null && value !== undefined && value !== ''
    }))

    return isValid
  }

  const getInputClass = (field) => {
    const baseClass = "w-full px-2 py-2 text-sm border rounded focus:outline-none focus:ring-1 text-center transition-colors"
    
    if (errors[field] && (dirty[field] || hasFocus[field])) {
      return `${baseClass} border-red-500 focus:ring-red-500 focus:border-red-500`
    }
    
    if (valid[field] && hasFocus[field]) {
      return `${baseClass} border-green-500 focus:ring-green-500 focus:border-green-500`
    }
    
    if (hasFocus[field]) {
      return `${baseClass} border-blue-500 focus:ring-blue-500 focus:border-blue-500`
    }
    
    return `${baseClass} border-gray-300 focus:ring-blue-500`
  }

  const handleWeightChange = (e) => {
    let value = e.target.value === '' ? null : parseFloat(e.target.value)
    
    // Автозамена нуля на вводимые значения
    if (set.weight_kg === 0 && value !== null && !isNaN(value)) {
      onUpdate({ weight_kg: value })
    } else {
      onUpdate({ weight_kg: value })
    }
    
    validateField('weight', value)
    setDirty(prev => ({ ...prev, weight: true }))
  }

  const handleRepsChange = (e) => {
    let value = e.target.value === '' ? null : parseInt(e.target.value)
    
    // Автозамена нуля на вводимые значения
    if (set.reps === 0 && value !== null && !isNaN(value)) {
      onUpdate({ reps: value })
    } else {
      onUpdate({ reps: value })
    }
    
    validateField('reps', value)
    setDirty(prev => ({ ...prev, reps: true }))
  }

  const handleRIRChange = (e) => {
    let value = e.target.value === '' ? null : parseFloat(e.target.value)
    
    // Автозамена нуля на вводимые значения
    if (set.rir === 0 && value !== null && !isNaN(value)) {
      onUpdate({ rir: value })
    } else {
      onUpdate({ rir: value })
    }
    
    validateField('rir', value)
    setDirty(prev => ({ ...prev, rir: true }))
  }

  const handleFocus = (field) => {
    setHasFocus(prev => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field) => {
    setHasFocus(prev => ({ ...prev, [field]: false }))
  }

  const getDisplayValue = (value) => {
    if (value === null || value === undefined) {
      return ''
    }
    return value.toString()
  }

  const showError = (field) => {
    return errors[field] && (dirty[field] || hasFocus[field])
  }

  const showValid = (field) => {
    return valid[field] && hasFocus[field] && !errors[field]
  }

  return (
    <div className="grid grid-cols-10 gap-2 items-center text-sm py-1">
      {/* Номер подхода */}
      <div className="col-span-1 flex justify-center">
        <span className="text-sm font-medium text-gray-600">
          {set.set_number}
        </span>
      </div>
      
      {/* Вес */}
      <div className="col-span-3 relative">
        {hasFocus.weight && errors.weight && (
          <div className="absolute bottom-full left-0 right-0 mb-1 text-xs text-red-600 bg-white p-1 rounded shadow border border-red-200 z-10">
            {errors.weight}
          </div>
        )}
        <input
          type="number"
          value={getDisplayValue(set.weight_kg)}
          onChange={handleWeightChange}
          onFocus={() => handleFocus('weight')}
          onBlur={() => handleBlur('weight')}
          className={getInputClass('weight')}
          placeholder="0.0"
          step="0.25"
          min="0"
          max="1000"
        />
        {showValid('weight') && (
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2" title="Правильное значение">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      
      {/* Повторения */}
      <div className="col-span-3 relative">
        {hasFocus.reps && errors.reps && (
          <div className="absolute bottom-full left-0 right-0 mb-1 text-xs text-red-600 bg-white p-1 rounded shadow border border-red-200 z-10">
            {errors.reps}
          </div>
        )}
        <input
          type="number"
          value={getDisplayValue(set.reps)}
          onChange={handleRepsChange}
          onFocus={() => handleFocus('reps')}
          onBlur={() => handleBlur('reps')}
          className={getInputClass('reps')}
          placeholder="0"
          min="0"
          max="100"
        />
        {showValid('reps') && (
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2" title="Правильное значение">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      
      {/* RIR */}
      <div className="col-span-2 relative">
        {hasFocus.rir && errors.rir && (
          <div className="absolute bottom-full left-0 right-0 mb-1 text-xs text-red-600 bg-white p-1 rounded shadow border border-red-200 z-10">
            {errors.rir}
          </div>
        )}
        <input
          type="number"
          value={getDisplayValue(set.rir)}
          onChange={handleRIRChange}
          onFocus={() => handleFocus('rir')}
          onBlur={() => handleBlur('rir')}
          className={getInputClass('rir')}
          placeholder="2.0"
          step="0.5"
          min="0"
          max="10"
        />
        {showValid('rir') && (
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2" title="Правильное значение">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      
      {/* Кнопка удаления */}
      <div className="col-span-1 flex justify-center">
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors p-1"
          title="Удалить подход"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default SetInput