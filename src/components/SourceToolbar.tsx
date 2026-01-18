import { useState } from 'react'

export type LayoutType = 
  | 'real-size'
  | 'full' | 'center'
  | 'left' | 'right' | 'top-half' | 'bottom-half' 
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'first-third' | 'center-third' | 'last-third' | 'first-two-thirds' | 'last-two-thirds'
  | 'first-fourth' | 'second-fourth' | 'third-fourth' | 'last-fourth'
  | 'first-sixth' | 'second-sixth' | 'third-sixth' | 'fourth-sixth' | 'fifth-sixth' | 'last-sixth'
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
  const [menuLevel, setMenuLevel] = useState<MenuLevel>('main')

  const isVisible = visible || isHovered || showSwitcher || showLayout || showViewMode

  // Reset menu level when closing layout menu
  const toggleLayout = () => {
    if (!showLayout) setMenuLevel('main')
    setShowLayout(!showLayout)
    setShowViewMode(false)
    setShowSwitcher(false)
  }

  const handleLayoutClick = (item: typeof MENU_ITEMS.main[0]) => {
    if (item.submenu) {
      setMenuLevel(item.submenu)
    } else if (item.type) {
      onLayout(item.type)
      setShowLayout(false)
    }
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { 
        setIsHovered(false)
        setShowSwitcher(false)
        setShowLayout(false)
        setShowViewMode(false)
        setMenuLevel('main')
      }}
    >
      {/* Top-Right: Source Selector & Close Button */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        {/* Source Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowSwitcher(!showSwitcher)
              setShowLayout(false)
              setShowViewMode(false)
            }}
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
            <div style={{ ...dropdownStyle, left: 'auto', right: 0 }}>
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

        {/* Close Button */}
        <button
          onClick={onDismiss}
          style={{
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
          title="Close"
        >
          ✕
        </button>
      </div>

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
        {/* Zoom Controls - only show in manual mode */}
        {viewMode === 'manual' && (
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
        )}

        {/* View Mode */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowViewMode(!showViewMode)
              setShowLayout(false)
              setShowSwitcher(false)
            }}
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
            onClick={toggleLayout}
            style={iconButtonStyle}
            title="Layout Presets"
          >
            ⊞
          </button>

          {showLayout && (
            <div style={{ ...dropdownStyle, bottom: '100%', top: 'auto', paddingBottom: '4px', paddingTop: 0 }}>
              <div style={dropdownInnerStyle}>
                {/* Back Button for Submenus */}
                {menuLevel !== 'main' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuLevel('main') }}
                    style={{
                      ...dropdownItemStyle,
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      marginBottom: '4px',
                      paddingBottom: '8px',
                      color: 'rgba(255,255,255,0.6)'
                    }}
                  >
                    <span>←</span>
                    <span>Back</span>
                  </button>
                )}

                {/* Menu Items */}
                {MENU_ITEMS[menuLevel].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleLayoutClick(opt)}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {opt.type ? <LayoutIcon type={opt.type} /> : <span style={{ width: 14 }}>📁</span>}
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    {opt.submenu && <span style={{ fontSize: '9px', opacity: 0.5 }}>▶</span>}
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

// Visual icon for layout presets
function LayoutIcon({ type }: { type: LayoutType }) {
  const rectProps = { stroke: "rgba(255,255,255,0.8)", strokeWidth: "1", fill: "none" }
  const activeProps = { fill: "rgba(255,255,255,0.9)", stroke: "none" }
  
  // Helper to render a rect by percentage
  const R = (x: number, y: number, w: number, h: number) => (
    <rect 
      x={0.5 + (x * 13)} 
      y={0.5 + (y * 9)} 
      width={w * 13} 
      height={h * 9} 
      rx="1" 
      {...activeProps} 
    />
  )

  return (
    <svg width="14" height="10" viewBox="0 0 14 10" style={{ opacity: 0.9 }}>
      {/* Base container */}
      <rect x="0.5" y="0.5" width="13" height="9" rx="1" {...rectProps} opacity="0.4" />
      
      {/* Basic */}
      {type === 'full' && R(0,0,1,1)}
      {type === 'left' && R(0,0,0.5,1)}
      {type === 'right' && R(0.5,0,0.5,1)}
      {type === 'top-half' && R(0,0,1,0.5)}
      {type === 'bottom-half' && R(0,0.5,1,0.5)}
      {type === 'center' && R(0.2,0.2,0.6,0.6)}

      {/* Corners */}
      {type === 'top-left' && R(0,0,0.5,0.5)}
      {type === 'top-right' && R(0.5,0,0.5,0.5)}
      {type === 'bottom-left' && R(0,0.5,0.5,0.5)}
      {type === 'bottom-right' && R(0.5,0.5,0.5,0.5)}

      {/* Thirds */}
      {type === 'first-third' && R(0,0,0.33,1)}
      {type === 'center-third' && R(0.33,0,0.33,1)}
      {type === 'last-third' && R(0.66,0,0.33,1)}
      {type === 'first-two-thirds' && R(0,0,0.66,1)}
      {type === 'last-two-thirds' && R(0.33,0,0.66,1)}

      {/* Fourths */}
      {type === 'first-fourth' && R(0,0,0.25,1)}
      {type === 'second-fourth' && R(0.25,0,0.25,1)}
      {type === 'third-fourth' && R(0.5,0,0.25,1)}
      {type === 'last-fourth' && R(0.75,0,0.25,1)}

      {/* Sixths */}
      {type === 'first-sixth' && R(0,0,0.166,1)}
      {type === 'second-sixth' && R(0.166,0,0.166,1)}
      {type === 'third-sixth' && R(0.333,0,0.166,1)}
      {type === 'fourth-sixth' && R(0.5,0,0.166,1)}
      {type === 'fifth-sixth' && R(0.666,0,0.166,1)}
      {type === 'last-sixth' && R(0.833,0,0.166,1)}
      
      {type === 'real-size' && (
        <>
          <rect x="4" y="2.5" width="6" height="5" {...activeProps} opacity="0.5" />
          <path d="M5 2.5V3.5 M7 2.5V3.5 M9 2.5V3.5" stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
        </>
      )}
    </svg>
  )
}

// Menu Definitions
type MenuLevel = 'main' | 'halves' | 'corners' | 'thirds' | 'fourths' | 'sixths'

const MENU_ITEMS: Record<MenuLevel, { id: string, label: string, type?: LayoutType, submenu?: MenuLevel }[]> = {
  main: [
    { id: 'size', label: '1:1 Size', type: 'real-size' },
    { id: 'full', label: 'Full Screen', type: 'full' },
    { id: 'center', label: 'Center', type: 'center' },
    { id: 'halves', label: 'Halves', submenu: 'halves' },
    { id: 'corners', label: 'Corners', submenu: 'corners' },
    { id: 'thirds', label: 'Thirds', submenu: 'thirds' },
    { id: 'fourths', label: 'Fourths', submenu: 'fourths' },
    { id: 'sixths', label: 'Sixths', submenu: 'sixths' },
  ],
  halves: [
    { id: 'left', label: 'Left Half', type: 'left' },
    { id: 'right', label: 'Right Half', type: 'right' },
    { id: 'top', label: 'Top Half', type: 'top-half' },
    { id: 'bottom', label: 'Bottom Half', type: 'bottom-half' },
  ],
  corners: [
    { id: 'tl', label: 'Top Left', type: 'top-left' },
    { id: 'tr', label: 'Top Right', type: 'top-right' },
    { id: 'bl', label: 'Bottom Left', type: 'bottom-left' },
    { id: 'br', label: 'Bottom Right', type: 'bottom-right' },
  ],
  thirds: [
    { id: 't1', label: 'First Third', type: 'first-third' },
    { id: 't2', label: 'Center Third', type: 'center-third' },
    { id: 't3', label: 'Last Third', type: 'last-third' },
    { id: 't23', label: 'First 2/3', type: 'first-two-thirds' },
    { id: 't32', label: 'Last 2/3', type: 'last-two-thirds' },
  ],
  fourths: [
    { id: 'f1', label: 'First Fourth', type: 'first-fourth' },
    { id: 'f2', label: 'Second Fourth', type: 'second-fourth' },
    { id: 'f3', label: 'Third Fourth', type: 'third-fourth' },
    { id: 'f4', label: 'Last Fourth', type: 'last-fourth' },
  ],
  sixths: [
    { id: 's1', label: 'First Sixth', type: 'first-sixth' },
    { id: 's2', label: 'Second Sixth', type: 'second-sixth' },
    { id: 's3', label: 'Third Sixth', type: 'third-sixth' },
    { id: 's4', label: 'Fourth Sixth', type: 'fourth-sixth' },
    { id: 's5', label: 'Fifth Sixth', type: 'fifth-sixth' },
    { id: 's6', label: 'Last Sixth', type: 'last-sixth' },
  ]
}

// ... existing style variants ...
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
  paddingTop: '4px',
  minWidth: '160px',
  maxHeight: '300px',
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
  gap: '10px',
}
