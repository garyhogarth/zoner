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

  // Sort by layerOrder (highest = front)
  const sortedLayers = [...layers].sort((a, b) => b.layerOrder - a.layerOrder)

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
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = layer.isMissing
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = layer.isMissing
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)'
                  }}
                >
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
                    {/* Move Up */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(layer.instanceId, 'up') }}
                      disabled={index === 0}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: index === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: index === 0 ? 'default' : 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Move forward"
                    >
                      ▲
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onReorder(layer.instanceId, 'down') }}
                      disabled={index === sortedLayers.length - 1}
                      style={{
                        width: '20px',
                        height: '20px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: index === sortedLayers.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: index === sortedLayers.length - 1 ? 'default' : 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Move back"
                    >
                      ▼
                    </button>

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
