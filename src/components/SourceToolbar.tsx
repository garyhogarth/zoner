import { useState } from 'react'

export type LayoutType = 'full' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'real-size'
export type ViewMode = 'cover' | 'contain' | 'stretch' | 'manual'

export interface Source {
  id: string
  name: string
  thumbnail: string
  appIcon?: string | null
}

interface SourceToolbarProps {
  sourceName: string
  scale: number
  onScaleChange: (newScale: number) => void
  onDismiss: () => void
  onSwitch: (newSourceId: string) => void
  availableSources: Source[]
  onLayout: (type: LayoutType) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  visible?: boolean
  className?: string
  style?: React.CSSProperties
}

export function SourceToolbar({
  sourceName,
  scale,
  onScaleChange,
  onDismiss,
  onSwitch,
  availableSources,
  onLayout,
  viewMode,
  onViewModeChange,
  visible = false,
  className,
  style,
}: SourceToolbarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showLayout, setShowLayout] = useState(false)
  const [showViewMode, setShowViewMode] = useState(false)

  const isVisible = visible || isHovered || showSwitcher || showLayout || showViewMode

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '6px 10px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s',
        cursor: 'move',
        pointerEvents: isVisible ? 'auto' : 'none',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { 
        setIsHovered(false)
        setShowSwitcher(false)
        setShowLayout(false)
        setShowViewMode(false)
      }}
      onMouseDown={e => {
        if ((e.target as HTMLElement).closest('button')) e.stopPropagation()
      }}
    >
      {/* Grip Handle */}
      <div style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
          <circle cx="1.5" cy="1.5" r="1.2" />
          <circle cx="1.5" cy="5" r="1.2" />
          <circle cx="1.5" cy="8.5" r="1.2" />
          <circle cx="4.5" cy="1.5" r="1.2" />
          <circle cx="4.5" cy="5" r="1.2" />
          <circle cx="4.5" cy="8.5" r="1.2" />
        </svg>
      </div>

      {/* Source Name & Switcher */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="source-switcher"
          style={iconButtonStyle(false)}
          title={sourceName}
        >
          <span style={{ 
            fontSize: '11px', 
            maxWidth: '80px',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap' 
          }}>
            {sourceName}
          </span>
          <span style={{ fontSize: '7px', marginLeft: '3px', opacity: 0.6 }}>▼</span>
        </button>

        {showSwitcher && (
          <div style={dropdownStyle} onMouseDown={e => e.stopPropagation()}>
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
        )}
      </div>

      <Divider />

      {/* Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button 
          onClick={() => onScaleChange(Math.max(0.1, scale - 0.1))} 
          style={smallButtonStyle}
          title="Zoom Out"
        >−</button>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', minWidth: '30px', textAlign: 'center', fontFamily: 'monospace' }}>
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={() => onScaleChange(Math.min(5, scale + 0.1))} 
          style={smallButtonStyle}
          title="Zoom In"
        >+</button>
      </div>

      <Divider />

      {/* View Mode */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowViewMode(!showViewMode)}
          style={iconButtonStyle(showViewMode)}
          title="View Mode"
        >
          {viewMode === 'manual' ? '🔍' : viewMode === 'cover' ? '⬛' : viewMode === 'contain' ? '📐' : '↔️'}
        </button>

        {showViewMode && (
          <div style={dropdownStyle} onMouseDown={e => e.stopPropagation()}>
            {[
              { id: 'manual', label: 'Manual (Pan & Zoom)', icon: '🔍' },
              { id: 'cover', label: 'Cover (Fill)', icon: '⬛' },
              { id: 'contain', label: 'Contain (Fit)', icon: '📐' },
              { id: 'stretch', label: 'Stretch', icon: '↔️' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { onViewModeChange(opt.id as ViewMode); setShowViewMode(false) }}
                style={{
                  ...dropdownItemStyle,
                  background: viewMode === opt.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = viewMode === opt.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = viewMode === opt.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layout Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowLayout(!showLayout)}
          style={iconButtonStyle(showLayout)}
          title="Layout Presets"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="1" width="5" height="5" rx="1" opacity="0.9"/>
            <rect x="8" y="1" width="5" height="5" rx="1" opacity="0.6"/>
            <rect x="1" y="8" width="5" height="5" rx="1" opacity="0.6"/>
            <rect x="8" y="8" width="5" height="5" rx="1" opacity="0.6"/>
          </svg>
        </button>

        {showLayout && (
          <div style={dropdownStyle} onMouseDown={e => e.stopPropagation()}>
            {[
              { id: 'real-size', label: '1:1 Real Size', icon: '📏' },
              { id: 'full', label: 'Full Screen', icon: '⬜' },
              { id: 'center', label: 'Center', icon: '🎯' },
              { id: 'left', label: 'Left Half', icon: '◧' },
              { id: 'right', label: 'Right Half', icon: '◨' },
              { id: 'top-left', label: 'Top Left', icon: '◰' },
              { id: 'top-right', label: 'Top Right', icon: '◳' },
              { id: 'bottom-left', label: 'Bottom Left', icon: '◱' },
              { id: 'bottom-right', label: 'Bottom Right', icon: '◲' },
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
        )}
      </div>

      <Divider />

      {/* Close Button */}
      <button
        onClick={onDismiss}
        style={{
          ...smallButtonStyle,
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
        }}
        title="Remove"
      >
        ✕
      </button>
    </div>
  )
}

// Simple divider component
function Divider() {
  return <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
}

// Style helpers
const iconButtonStyle = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  color: active ? '#93c5fd' : 'white',
  padding: '5px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  transition: 'background-color 0.15s',
})

const smallButtonStyle: React.CSSProperties = {
  width: '22px',
  height: '22px',
  borderRadius: '6px',
  border: 'none',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 500,
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  minWidth: '160px',
  maxHeight: '280px',
  overflowY: 'auto',
  background: 'rgba(0, 0, 0, 0.95)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '10px',
  padding: '4px',
  zIndex: 200,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
}

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '7px 10px',
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
