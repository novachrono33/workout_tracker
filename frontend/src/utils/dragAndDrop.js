// frontend\src\utils\dragAndDrop.js
export const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export const handleDragStart = (e, index) => {
  e.dataTransfer.setData('text/plain', index.toString())
  e.currentTarget.style.opacity = '0.4'
}

export const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

export const handleDrop = (e, index, items, setItems) => {
  e.preventDefault()
  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
  const toIndex = index
  
  if (fromIndex !== toIndex) {
    const reorderedItems = reorder(items, fromIndex, toIndex)
    // Update order property for each item
    const itemsWithUpdatedOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx
    }))
    setItems(itemsWithUpdatedOrder)
  }
  
  e.currentTarget.style.backgroundColor = ''
}

export const handleDragEnd = (e) => {
  e.currentTarget.style.opacity = '1'
}

export const handleDragEnter = (e) => {
  e.currentTarget.style.backgroundColor = '#f0f9ff'
}

export const handleDragLeave = (e) => {
  e.currentTarget.style.backgroundColor = ''
}