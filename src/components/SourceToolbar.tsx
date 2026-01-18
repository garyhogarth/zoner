
import { useState, useRef } from 'react'
import { IconButton } from './ui/Button'
import { Menu, MenuItem, MenuHeader } from './ui/Menu'
import { Tooltip } from './ui/Tooltip'

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
  
  // Menu states & refs
  const [showSwitcher, setShowSwitcher] = useState(false)
  const switcherRef = useRef<HTMLButtonElement>(null)

  const [showLayout, setShowLayout] = useState(false)
  const layoutRef = useRef<HTMLButtonElement>(null)

  const [showViewMode, setShowViewMode] = useState(false)
  const viewModeRef = useRef<HTMLButtonElement>(null)

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
      className="absolute inset-0 pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { 
        setIsHovered(false)
        setShowSwitcher(false)
        setShowLayout(false)
        setShowViewMode(false)
        setMenuLevel('main')
      }}
    >
      {/* Top-Right Action Group */}
      <div 
        className={`
          absolute top-2 right-2 flex gap-1 items-center
          transition-opacity duration-200
          ${isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
        `}
      >
        {/* Source Switcher */}
        <div className="relative">
          <button
            ref={switcherRef}
            onClick={() => {
              setShowSwitcher(!showSwitcher)
              setShowLayout(false)
              setShowViewMode(false)
            }}
            className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm border border-white/15 text-white px-2.5 py-1 rounded-lg shadow-sm hover:bg-black/90 transition-colors"
            title={sourceName}
          >
            <span className="text-[11px] max-w-[100px] truncate">{sourceName}</span>
            <span className="text-[7px] opacity-60">▼</span>
          </button>

          <Menu 
            isOpen={showSwitcher} 
            onClose={() => setShowSwitcher(false)} 
            triggerRef={switcherRef}
            placement="bottom-end"
            className="w-48"
          >
             <div className="max-h-[300px] overflow-y-auto">
              {availableSources.map(s => (
                <MenuItem
                  key={s.id}
                  onClick={() => { onSwitch(s.id); setShowSwitcher(false) }}
                  label={s.name}
                  icon={s.appIcon ? <img src={s.appIcon} className="w-3 h-3 rounded" /> : '📺'}
                />
              ))}
             </div>
          </Menu>
        </div>

        {/* Drag Handle */}
        <Tooltip content="Drag to move" side="bottom">
          <div
            className="drag-handle w-8 h-8 rounded-lg bg-black/70 backdrop-blur-sm border border-white/15 
                       flex items-center justify-center cursor-move text-white/80 hover:text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1V11M1 6H11M6 1L3 4M6 1L9 4M6 11L3 8M6 11L9 8M1 6L4 3M1 6L4 9M11 6L8 3M11 6L8 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </Tooltip>

        {/* Close Button */}
        <IconButton 
          variant="solid" 
          onClick={onDismiss} 
          className="w-8 h-8 rounded-lg bg-black/70 border-white/15 text-white/70 hover:text-white"
        >
          ✕
        </IconButton>
      </div>

      {/* Bottom-Left View/Layout Group */}
      <div 
        className={`
          absolute bottom-2 left-2 flex gap-1
          transition-opacity duration-200
          ${isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
        `}
      >
        {/* Zoom Controls */}
        {viewMode === 'manual' && (
          <div className="flex items-center gap-0.5 bg-black/80 backdrop-blur-sm border border-white/15 rounded-lg p-0.5 mr-1">
            <IconButton size="sm" onClick={() => onScaleChange(Math.max(0.1, scale - 0.1))} className="w-5 h-5 rounded hover:bg-white/10 text-white">−</IconButton>
            <span className="text-[9px] text-white/80 min-w-[28px] text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <IconButton size="sm" onClick={() => onScaleChange(Math.min(5, scale + 0.1))} className="w-5 h-5 rounded hover:bg-white/10 text-white">+</IconButton>
          </div>
        )}

        {/* View Mode */}
        <div className="relative">
          <IconButton
            ref={viewModeRef}
            variant="solid" 
            onClick={() => {
              setShowViewMode(!showViewMode)
              setShowLayout(false)
              setShowSwitcher(false)
            }}
            className="w-8 h-8 rounded-lg bg-black/80 border-white/15 text-sm"
          >
            {viewMode === 'manual' ? '🔍' : viewMode === 'cover' ? '⬛' : viewMode === 'contain' ? '📐' : '↔️'}
          </IconButton>

          <Menu 
            isOpen={showViewMode} 
            onClose={() => setShowViewMode(false)} 
            triggerRef={viewModeRef}
            placement="top-start"
          >
            <MenuHeader>View Mode</MenuHeader>
            {[
              { id: 'manual', label: 'Manual', icon: '🔍' },
              { id: 'cover', label: 'Cover', icon: '⬛' },
              { id: 'contain', label: 'Contain', icon: '📐' },
              { id: 'stretch', label: 'Stretch', icon: '↔️' },
            ].map(opt => (
              <MenuItem
                key={opt.id}
                onClick={() => { onViewModeChange(opt.id as ViewMode); setShowViewMode(false) }}
                label={opt.label}
                icon={opt.icon}
                active={viewMode === opt.id}
              />
            ))}
          </Menu>
        </div>

        {/* Layout Presets */}
        <div className="relative">
          <IconButton 
            ref={layoutRef}
            variant="solid" 
            onClick={toggleLayout}
            className="w-8 h-8 rounded-lg bg-black/80 border-white/15 text-sm"
          >
            ⊞
          </IconButton>
          
          <Menu 
            isOpen={showLayout} 
            onClose={() => setShowLayout(false)} 
            triggerRef={layoutRef}
            placement="top-start"
            className="w-48 max-h-[400px] overflow-y-auto"
          >
             {menuLevel !== 'main' && (
               <MenuItem 
                 label="Back" 
                 icon="←" 
                 onClick={() => setMenuLevel('main')} 
                 className="sticky top-0 bg-zinc-900 border-b border-white/10 z-10"
               />
             )}
             
             {MENU_ITEMS[menuLevel].map(opt => (
               <MenuItem
                 key={opt.id}
                 onClick={() => handleLayoutClick(opt as any)}
                 label={opt.label}
                 icon={opt.type ? <LayoutIcon type={opt.type} /> : '📁'}
                 hasSubmenu={!!opt.submenu}
               />
             ))}
          </Menu>
        </div>
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
    <svg width="14" height="10" viewBox="0 0 14 10" className="opacity-90">
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
    { id: 'size', label: 'Actual size', type: 'real-size' },
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
