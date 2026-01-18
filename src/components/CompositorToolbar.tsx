import { useState } from 'react'
import type { SavedLayout } from '../utils/layoutStore'

interface LayerItem {
  instanceId: string
  name: string
  layerOrder: number
  isMissing?: boolean
  appIcon?: string | null
}

interface CompositorToolbarProps {
  visible: boolean
  // Layers
  layers: LayerItem[]
  onReorderLayer: (instanceId: string, direction: 'up' | 'down') => void
  onCloseLayer: (instanceId: string) => void
  // Layouts
  savedLayouts: SavedLayout[]
  onSaveLayout: (name: string) => void
  onLoadLayout: (layoutId: string) => void
  onDeleteLayout: (layoutId: string) => void
  // Add Source
  onAddSource: () => void
}

type PanelType = 'layers' | 'layouts' | null

export function CompositorToolbar({
  visible,
  layers,
  onReorderLayer,
  onCloseLayer,
  savedLayouts,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onAddSource,
}: CompositorToolbarProps) {
  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const isVisible = visible || isHovered || activePanel !== null

  const handleSave = () => {
    if (saveName.trim()) {
      onSaveLayout(saveName.trim())
      setSaveName('')
      setShowSaveInput(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDeleteLayout(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  // Sort layers by order (highest = front)
  const sortedLayers = [...layers].sort((a, b) => b.layerOrder - a.layerOrder)

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel)
    setShowSaveInput(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 100,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { 
        setIsHovered(false)
        if (!activePanel) {
          setShowSaveInput(false)
        }
      }}
    >
      {/* Icon Bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        {/* Add Source */}
        <button
          onClick={onAddSource}
          style={buttonStyle(false)}
          title="Add Source"
        >
          <span style={{ fontSize: '18px', fontWeight: 300 }}>+</span>
        </button>

        {/* Layers */}
        <button
          onClick={() => togglePanel('layers')}
          style={buttonStyle(activePanel === 'layers')}
          title="Layers"
        >
          <span style={{ fontSize: '16px' }}>☰</span>
        </button>

        {/* Layouts */}
        <button
          onClick={() => togglePanel('layouts')}
          style={buttonStyle(activePanel === 'layouts')}
          title="Saved Layouts"
        >
          <span style={{ fontSize: '14px' }}>💾</span>
        </button>
      </div>

      {/* Layers Panel */}
      {activePanel === 'layers' && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            Layers ({layers.length})
            <button onClick={() => setActivePanel(null)} style={closeButtonStyle}>✕</button>
          </div>
          <div style={{ padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {sortedLayers.length === 0 ? (
              <div style={emptyStyle}>No sources added</div>
            ) : (
              sortedLayers.map((layer, index) => (
                <div
                  key={layer.instanceId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    backgroundColor: layer.isMissing
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <span style={layerNumberStyle}>{layers.length - index}</span>
                  {layer.appIcon ? (
                    <img src={layer.appIcon} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
                  ) : (
                    <span style={{ fontSize: '12px' }}>{layer.isMissing ? '⚠️' : '📺'}</span>
                  )}
                  <span style={{
                    flex: 1,
                    fontSize: '11px',
                    color: layer.isMissing ? '#fca5a5' : 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {layer.name}
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      onClick={() => onReorderLayer(layer.instanceId, 'up')}
                      disabled={index === 0}
                      style={miniButtonStyle(index === 0)}
                    >▲</button>
                    <button
                      onClick={() => onReorderLayer(layer.instanceId, 'down')}
                      disabled={index === sortedLayers.length - 1}
                      style={miniButtonStyle(index === sortedLayers.length - 1)}
                    >▼</button>
                    <button
                      onClick={() => onCloseLayer(layer.instanceId)}
                      style={{ ...miniButtonStyle(false), color: '#f87171' }}
                    >✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Layouts Panel */}
      {activePanel === 'layouts' && (
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            Saved Layouts
            <button onClick={() => setActivePanel(null)} style={closeButtonStyle}>✕</button>
          </div>
          
          {/* Save Input */}
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {showSaveInput ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Name..."
                  autoFocus
                  style={inputStyle}
                />
                <button onClick={handleSave} style={saveButtonStyle}>Save</button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                style={saveCurrentStyle}
              >
                + Save Current
              </button>
            )}
          </div>

          {/* Layout List */}
          <div style={{ padding: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {savedLayouts.length === 0 ? (
              <div style={emptyStyle}>No saved layouts</div>
            ) : (
              savedLayouts.map((layout) => (
                <div
                  key={layout.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {layout.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      {layout.sources.length} sources • {formatDate(layout.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    <button
                      onClick={() => { onLoadLayout(layout.id); setActivePanel(null); }}
                      style={loadButtonStyle}
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(layout.id)}
                      style={{
                        ...deleteButtonStyle,
                        backgroundColor: confirmDelete === layout.id ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                        color: confirmDelete === layout.id ? 'white' : '#fca5a5',
                      }}
                    >
                      {confirmDelete === layout.id ? '?' : '🗑'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Style helpers
const buttonStyle = (active: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
  color: active ? '#93c5fd' : 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s',
})

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: '52px',
  left: 0,
  width: '240px',
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  overflow: 'hidden',
}

const panelHeaderStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '11px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.4)',
  cursor: 'pointer',
  fontSize: '12px',
  padding: 0,
}

const emptyStyle: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.4)',
  fontSize: '12px',
}

const layerNumberStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '9px',
  color: 'rgba(255, 255, 255, 0.6)',
  flexShrink: 0,
}

const miniButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '18px',
  height: '18px',
  border: 'none',
  backgroundColor: 'transparent',
  color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
})

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'white',
  fontSize: '12px',
  outline: 'none',
}

const saveButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: 'white',
  fontSize: '11px',
  cursor: 'pointer',
  fontWeight: 500,
}

const saveCurrentStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px dashed rgba(255, 255, 255, 0.3)',
  backgroundColor: 'transparent',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '12px',
  cursor: 'pointer',
}

const loadButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: 'white',
  fontSize: '10px',
  cursor: 'pointer',
  fontWeight: 500,
}

const deleteButtonStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderRadius: '4px',
  border: 'none',
  fontSize: '10px',
  cursor: 'pointer',
}
