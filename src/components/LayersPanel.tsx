import { useState } from 'react'

interface LayerItem {
  instanceId: string
  name: string
  layerOrder: number
  isMissing?: boolean
  appIcon?: string | null
}

interface LayersPanelProps {
  layers: LayerItem[]
  onReorder: (instanceId: string, direction: 'up' | 'down') => void
  onClose: (instanceId: string) => void
  onSelect?: (instanceId: string) => void
}

export function LayersPanel({ layers, onReorder, onClose, onSelect }: LayersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Sort by layerOrder (highest = front)
  const sortedLayers = [...layers].sort((a, b) => b.layerOrder - a.layerOrder)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const draggedLayer = sortedLayers[draggedIndex]
    
    // Determine if we're moving up or down
    if (dropIndex < draggedIndex) {
      // Moving up (increasing layer order)
      onReorder(draggedLayer.instanceId, 'up')
      // May need to call multiple times for larger jumps
      const steps = draggedIndex - dropIndex
      for (let i = 1; i < steps; i++) {
        setTimeout(() => onReorder(draggedLayer.instanceId, 'up'), i * 50)
      }
    } else {
      // Moving down (decreasing layer order)
      onReorder(draggedLayer.instanceId, 'down')
      const steps = dropIndex - draggedIndex
      for (let i = 1; i < steps; i++) {
        setTimeout(() => onReorder(draggedLayer.instanceId, 'down'), i * 50)
      }
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div style={{
      position: 'fixed',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 50,
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
        title="Layers"
      >
        ☰
      </button>

      {/* Layers Panel */}
      {isExpanded && (
        <div style={{
          position: 'absolute',
          left: '44px',
          top: '0',
          width: '220px',
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Layers ({layers.length})
          </div>

          {/* Layer List */}
          {sortedLayers.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '13px',
            }}>
              No sources added
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {sortedLayers.map((layer, index) => (
                <div
                  key={layer.instanceId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelect?.(layer.instanceId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    backgroundColor: layer.isMissing 
                      ? 'rgba(239, 68, 68, 0.1)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    cursor: 'grab',
                    transition: 'background-color 0.15s, transform 0.15s',
                    opacity: draggedIndex === index ? 0.5 : 1,
                    transform: dragOverIndex === index && draggedIndex !== index 
                      ? 'translateY(-2px)' 
                      : 'none',
                    borderTop: dragOverIndex === index && draggedIndex !== null && draggedIndex > index
                      ? '2px solid #3b82f6'
                      : 'none',
                    borderBottom: dragOverIndex === index && draggedIndex !== null && draggedIndex < index
                      ? '2px solid #3b82f6'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (draggedIndex === null) {
                      e.currentTarget.style.backgroundColor = layer.isMissing
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = layer.isMissing
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Drag Handle */}
                  <div style={{
                    width: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    flexShrink: 0,
                    opacity: 0.4,
                  }}>
                    <div style={{ width: '100%', height: '2px', borderRadius: '1px', backgroundColor: 'currentColor' }} />
                    <div style={{ width: '100%', height: '2px', borderRadius: '1px', backgroundColor: 'currentColor' }} />
                    <div style={{ width: '100%', height: '2px', borderRadius: '1px', backgroundColor: 'currentColor' }} />
                  </div>

                  {/* Layer Number */}
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    flexShrink: 0,
                  }}>
                    {layers.length - index}
                  </span>

                  {/* Icon */}
                  {layer.appIcon ? (
                    <img 
                      src={layer.appIcon} 
                      alt="" 
                      style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0 }} 
                    />
                  ) : (
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>
                      {layer.isMissing ? '⚠️' : '📺'}
                    </span>
                  )}

                  {/* Name */}
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                    color: layer.isMissing ? '#fca5a5' : 'white',
                  }}>
                    {layer.name}
                  </span>

                  {/* Controls */}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {/* Close */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onClose(layer.instanceId) }}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
