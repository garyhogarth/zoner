import { useState } from 'react'

export type LayoutType = 'full' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'real-size'
export type ViewMode = 'cover' | 'contain' | 'stretch' | 'manual'

export interface Source {
  id: string
  name: string
  thumbnail: string
  appIcon?: string | null
}

interface SourceControlsProps {
  sourceName: string
  scale: number
  onScaleChange: (newScale: number) => void
  onDismiss: () => void
  onSwitch: (newSourceId: string) => void
  availableSources: Source[]
  onLayout: (type: LayoutType) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  visible: boolean
}

export function SourceControls({
  sourceName,
  scale,
  onScaleChange,
  onDismiss,
  onSwitch,
  availableSources,
  onLayout,
  viewMode,
  onViewModeChange,
  visible,
}: SourceControlsProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showLayout, setShowLayout] = useState(false)
  const [showViewMode, setShowViewMode] = useState(false)

  const isVisible = visible || isHovered || showSwitcher || showLayout || showViewMode

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { 
        setIsHovered(false)
        setShowSwitcher(false)
        setShowLayout(false)
        setShowViewMode(false)
      }}
    >
      {/* Top-Left: Source Selector */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          style={pillButtonStyle}
          title={sourceName}
        >
          <span style={{ 
            fontSize: '11px', 
            maxWidth: '100px',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {sourceName}
          </span>
          <span style={{ fontSize: '7px', marginLeft: '3px', opacity: 0.6 }}>▼</span>
        </button>

        {showSwitcher && (
          <div style={dropdownStyle}>
            <div style={dropdownInnerStyle}>
              {availableSources.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onSwitch(s.id); setShowSwitcher(false) }}
                  style={dropdownItemStyle}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {s.appIcon ? <img src={s.appIcon} style={{ width: 12, height: 12, borderRadius: 2 }} /> : <span>📺</span>}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top-Right: Close Button */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          pointerEvents: isVisible ? 'auto' : 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        title="Close"
      >
        ✕
      </button>

      {/* Bottom-Left: Zoom & Layout Controls */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        display: 'flex',
        gap: '4px',
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        {/* Zoom Controls */}
        <div style={{ ...pillContainerStyle, display: 'flex', alignItems: 'center', gap: '3px' }}>
          <button 
            onClick={() => onScaleChange(Math.max(0.1, scale - 0.1))} 
            style={miniButtonStyle}
            title="Zoom Out"
          >−</button>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', minWidth: '28px', textAlign: 'center', fontFamily: 'monospace' }}>
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={() => onScaleChange(Math.min(5, scale + 0.1))} 
            style={miniButtonStyle}
            title="Zoom In"
          >+</button>
        </div>

        {/* View Mode */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowViewMode(!showViewMode)}
            style={iconButtonStyle}
            title="View Mode"
          >
            {viewMode === 'manual' ? '🔍' : viewMode === 'cover' ? '⬛' : viewMode === 'contain' ? '📐' : '↔️'}
          </button>

          {showViewMode && (
            <div style={{ ...dropdownStyle, bottom: '100%', top: 'auto', paddingBottom: '4px', paddingTop: 0 }}>
              <div style={dropdownInnerStyle}>
                {[
                  { id: 'manual', label: 'Manual', icon: '🔍' },
                  { id: 'cover', label: 'Cover', icon: '⬛' },
                  { id: 'contain', label: 'Contain', icon: '📐' },
                  { id: 'stretch', label: 'Stretch', icon: '↔️' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { onViewModeChange(opt.id as ViewMode); setShowViewMode(false) }}
                    style={{
                      ...dropdownItemStyle,
                      background: viewMode === opt.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = viewMode === opt.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Layout Presets */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLayout(!showLayout)}
            style={iconButtonStyle}
            title="Layout Presets"
          >
            ⊞
          </button>

          {showLayout && (
            <div style={{ ...dropdownStyle, bottom: '100%', top: 'auto', paddingBottom: '4px', paddingTop: 0 }}>
              <div style={dropdownInnerStyle}>
                {[
                  { id: 'real-size', label: '1:1 Size', icon: '📏' },
                  { id: 'full', label: 'Full', icon: '⬜' },
                  { id: 'left', label: 'Left', icon: '◧' },
                  { id: 'right', label: 'Right', icon: '◨' },
                  { id: 'top-left', label: 'TL', icon: '◰' },
                  { id: 'top-right', label: 'TR', icon: '◳' },
                  { id: 'bottom-left', label: 'BL', icon: '◱' },
                  { id: 'bottom-right', label: 'BR', icon: '◲' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { onLayout(opt.id as LayoutType); setShowLayout(false) }}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right: Drag Handle */}
      <div
        className="drag-handle"
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'move',
          pointerEvents: isVisible ? 'auto' : 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
        title="Drag to move"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="rgba(255,255,255,0.5)">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="2" cy="5" r="1.2" />
          <circle cx="2" cy="8" r="1.2" />
          <circle cx="5" cy="2" r="1.2" />
          <circle cx="5" cy="5" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="8" cy="5" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
        </svg>
      </div>
    </div>
  )
}

// Style helpers
const pillButtonStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: 'white',
  padding: '5px 10px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  fontSize: '11px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
}

const pillContainerStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '4px 8px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
}

const iconButtonStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
}

const miniButtonStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.15)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 500,
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  paddingTop: '4px',  // Use padding instead of margin so hover continues through gap
  minWidth: '140px',
  maxHeight: '250px',
  overflowY: 'auto',
  zIndex: 200,
}

const dropdownInnerStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '10px',
  padding: '4px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
}

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '6px 10px',
  background: 'transparent',
  border: 'none',
  color: 'white',
  fontSize: '11px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}
