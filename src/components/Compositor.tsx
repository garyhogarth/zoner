
import { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { clsx } from 'clsx'

import { SourcePicker } from './SourcePicker'
import { fetchUnifiedSources, type Source } from '../utils/sources'
import { SourceControls, type LayoutType, type ViewMode } from './SourceToolbar'
import { CompositorToolbar } from './CompositorToolbar'
import { 
  loadLayouts, 
  saveLayout, 
  deleteLayout, 
  getLayout,
  type SavedLayout,
  type SavedSourceState 
} from '../utils/layoutStore'
import { setTheme, initTheme } from '../utils/themeStore'

interface ComposableSource extends Source {
  instanceId?: string
  x: number
  y: number
  width: number
  height: number
  scale: number
  pan: { x: number; y: number }
  viewMode: ViewMode
  layerOrder: number
  isMissing?: boolean
  nativeWidth?: number
  nativeHeight?: number
}

export function Compositor() {
  const [activeSources, setActiveSources] = useState<ComposableSource[]>([])
  const [pickerSources, setPickerSources] = useState<Source[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [replaceInstanceId, setReplaceInstanceId] = useState<string | null>(null)
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null)
  const [isModifierPressed, setIsModifierPressed] = useState(false)
  
  // Saved layouts
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(() => loadLayouts())
  
  // Window focus state for UI visibility
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    setSavedLayouts(loadLayouts())
    
    // Track modifier keys for drag operations
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') setIsModifierPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') setIsModifierPressed(false)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Window focus detection
  useEffect(() => {
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Fetch sources on mount so they are available for switchers too
  useEffect(() => {
    const fetch = async () => {
      try {
        const sources = await fetchUnifiedSources()
        setPickerSources(sources)
      } catch (e) {
        console.error('Failed to get sources', e)
      }
    }
    fetch()
    const interval = setInterval(fetch, 5000) // Poll for new sources occasionally
    
    // Init theme
    initTheme()
    
    return () => clearInterval(interval)
  }, [])

  const handleOpenPicker = async () => {
    // Refresh immediately on click
    try {
      const sources = await fetchUnifiedSources()
      setPickerSources(sources)
      setShowPicker(true)
      setReplaceInstanceId(null)
    } catch (e) {}
  }

  const handleAddSource = (source: Source) => {
    const instanceId = Date.now().toString() + Math.random().toString().slice(2, 5)
    
    // If replacing a missing source
    if (replaceInstanceId) {
      setActiveSources(activeSources.map(s => 
        s.instanceId === replaceInstanceId 
          ? { ...source, instanceId: s.instanceId, x: s.x, y: s.y, width: s.width, height: s.height, scale: s.scale, pan: s.pan, viewMode: s.viewMode, layerOrder: s.layerOrder, isMissing: false }
          : s
      ))
      setShowPicker(false)
      setReplaceInstanceId(null)
      return
    }
    
    // Offset logic for new sources
    const baseOffset = 50
    const step = 30
    const offset = activeSources.length * step
    
    // New source gets highest layer order
    const maxLayer = activeSources.reduce((max, s) => Math.max(max, s.layerOrder), 0)
    
    setActiveSources([...activeSources, { 
      ...source, 
      instanceId, 
      x: baseOffset + offset, 
      y: baseOffset + offset,
      width: 400,
      height: 300,
      scale: 1,
      pan: { x: 0, y: 0 },
      viewMode: 'manual',
      layerOrder: maxLayer + 1,
      isMissing: false
    }])
    setShowPicker(false)
  }

  const handleDismissSource = (instanceId: string) => {
    setActiveSources(activeSources.filter(s => s.instanceId !== instanceId))
  }

  const handleSwitchSource = (instanceId: string, newSourceId: string) => {
    const newSource = pickerSources.find(s => s.id === newSourceId)
    if (!newSource) return
    setActiveSources(activeSources.map(s => 
      s.instanceId === instanceId 
        ? { 
            ...newSource, 
            instanceId: s.instanceId, 
            x: s.x, 
            y: s.y, 
            width: s.width, // Keep existing size
            height: s.height, 
            scale: 1, // Reset Zoom to 100% (safe default)
            pan: { x: 0, y: 0 }, // Reset Pan
            viewMode: 'manual', 
            layerOrder: s.layerOrder, 
            isMissing: false 
          }
        : s
    ))
  }

  const handleUpdateSource = (instanceId: string, updates: Partial<ComposableSource>) => {
    setActiveSources(activeSources.map(s => 
      s.instanceId === instanceId ? { ...s, ...updates } : s
    ))
  }

  const handleLayout = (instanceId: string, type: LayoutType) => {
    const { innerWidth: W, innerHeight: H } = window
    const P = 10 // Padding for resize handles
    let updates: Partial<ComposableSource> = {}

      const getGridRect = (segments: number, index: number, span: number = 1) => {
        const gap = P
        const avail = W - 2 * P - (segments - 1) * gap
        const unit = avail / segments
        const x = P + index * (unit + gap)
        const w = unit * span + (span - 1) * gap
        return { x, width: w }
      }
      
      const setRect = (hSeg: number, hIdx: number, hSpan: number, vSeg: number = 1, vIdx: number = 0, vSpan: number = 1) => {
        const h = getGridRect(hSeg, hIdx, hSpan)
        const vGap = P
        const vAvail = H - 2 * P - (vSeg - 1) * vGap
        const vUnit = vAvail / vSeg
        const y = P + vIdx * (vUnit + vGap)
        const height = vUnit * vSpan + (vSpan - 1) * vGap
        
        updates = { 
          x: h.x, 
          y, 
          width: h.width, 
          height,
          scale: 1,
          pan: { x: 0, y: 0 }
        }
      }

      switch (type) {
        case 'full': setRect(1, 0, 1); break
        case 'center': 
          updates = { 
            x: (W - 800) / 2, 
            y: (H - 600) / 2, 
            width: 800, 
            height: 600,
            scale: 1,
            pan: { x: 0, y: 0 }
          }
          break
        
        // Halves
        case 'left': setRect(2, 0, 1); break
        case 'right': setRect(2, 1, 1); break
        case 'top-half': setRect(1, 0, 1, 2, 0, 1); break
        case 'bottom-half': setRect(1, 0, 1, 2, 1, 1); break
        
        // Corners
        case 'top-left': setRect(2, 0, 1, 2, 0, 1); break
        case 'top-right': setRect(2, 1, 1, 2, 0, 1); break
        case 'bottom-left': setRect(2, 0, 1, 2, 1, 1); break
        case 'bottom-right': setRect(2, 1, 1, 2, 1, 1); break

        // Thirds
        case 'first-third': setRect(3, 0, 1); break
        case 'center-third': setRect(3, 1, 1); break
        case 'last-third': setRect(3, 2, 1); break
        case 'first-two-thirds': setRect(3, 0, 2); break
        case 'last-two-thirds': setRect(3, 1, 2); break

        // Fourths
        case 'first-fourth': setRect(4, 0, 1); break
        case 'second-fourth': setRect(4, 1, 1); break
        case 'third-fourth': setRect(4, 2, 1); break
        case 'last-fourth': setRect(4, 3, 1); break

        // Sixths
        case 'first-sixth': setRect(6, 0, 1); break
        case 'second-sixth': setRect(6, 1, 1); break
        case 'third-sixth': setRect(6, 2, 1); break
        case 'fourth-sixth': setRect(6, 3, 1); break
        case 'fifth-sixth': setRect(6, 4, 1); break
        case 'last-sixth': setRect(6, 5, 1); break

      case 'real-size': {
        const source = activeSources.find(s => s.instanceId === instanceId)
        
        if (source?.nativeWidth && source?.nativeHeight) {

          const targetW = source.nativeWidth
          const targetH = source.nativeHeight
          const maxW = W - P * 2
          const maxH = H - P * 2
          const clampedW = Math.min(targetW, maxW)
          const clampedH = Math.min(targetH, maxH)
          
          const fits = (source.x + clampedW <= W) && (source.y + clampedH <= H) && (source.x >= 0) && (source.y >= 0)

          const targetX = fits ? source.x : (W - clampedW) / 2
          const targetY = fits ? source.y : (H - clampedH) / 2

          updates = { 
            width: clampedW,
            height: clampedH,
            x: targetX,
            y: targetY,
            viewMode: 'manual',
            pan: { x: 0, y: 0 } // Reset pan
          }
        } else {
          updates = { 
            viewMode: 'manual',
            pan: { x: 0, y: 0 }
          }
        }
        break
      }
    }
    handleUpdateSource(instanceId, updates)
  }

  // Layer reordering
  const handleReorderLayer = (instanceId: string, direction: 'up' | 'down') => {
    const sorted = [...activeSources].sort((a, b) => b.layerOrder - a.layerOrder)
    const index = sorted.findIndex(s => s.instanceId === instanceId)
    
    if (direction === 'up' && index > 0) {
      const aboveId = sorted[index - 1].instanceId
      const currentOrder = sorted[index].layerOrder
      const aboveOrder = sorted[index - 1].layerOrder
      
      setActiveSources(activeSources.map(s => {
        if (s.instanceId === instanceId) return { ...s, layerOrder: aboveOrder }
        if (s.instanceId === aboveId) return { ...s, layerOrder: currentOrder }
        return s
      }))
    } else if (direction === 'down' && index < sorted.length - 1) {
      const belowId = sorted[index + 1].instanceId
      const currentOrder = sorted[index].layerOrder
      const belowOrder = sorted[index + 1].layerOrder
      
      setActiveSources(activeSources.map(s => {
        if (s.instanceId === instanceId) return { ...s, layerOrder: belowOrder }
        if (s.instanceId === belowId) return { ...s, layerOrder: currentOrder }
        return s
      }))
    }
  }

  const handleSaveLayout = (name: string) => {
    const sourcesToSave: SavedSourceState[] = activeSources.map(s => ({
      sourceId: s.id,
      sourceName: s.name,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      scale: s.scale,
      pan: s.pan,
      viewMode: s.viewMode,
      layerOrder: s.layerOrder,
    }))
    
    saveLayout(
      name,
      { width: window.innerWidth, height: window.innerHeight },
      sourcesToSave
    )
    setSavedLayouts(loadLayouts())
  }

  const handleLoadLayout = (layoutId: string) => {
    const layout = getLayout(layoutId)
    if (!layout) return

    try {
      // @ts-ignore
      window.ipcRenderer?.send('resize-window', layout.windowSize)
    } catch (e) {}

    const restored: ComposableSource[] = layout.sources.map((saved, idx) => {
      const found = pickerSources.find(s => s.id === saved.sourceId)
      const instanceId = Date.now().toString() + idx + Math.random().toString().slice(2, 5)
      
      if (found) {
        return {
          ...found,
          instanceId,
          x: saved.x,
          y: saved.y,
          width: saved.width,
          height: saved.height,
          scale: saved.scale,
          pan: saved.pan,
          viewMode: saved.viewMode,
          layerOrder: saved.layerOrder,
          isMissing: false,
        }
      } else {
        return {
          id: saved.sourceId,
          name: saved.sourceName,
          thumbnail: '',
          instanceId,
          x: saved.x,
          y: saved.y,
          width: saved.width,
          height: saved.height,
          scale: saved.scale,
          pan: saved.pan,
          viewMode: saved.viewMode,
          layerOrder: saved.layerOrder,
          isMissing: true,
        }
      }
    })

    // Apply saved theme if exists
    if (layout.theme) {
      setTheme(layout.theme)
      // Force toolbar re-render? The toolbar reads from local state or needs prop? 
      // The toolbar keeps its own state `currentTheme`. We should lift it or key it.
      // But `setTheme` is global. We should probably force a refresh.
      // Easiest is to add `key` to toolbar or pass current theme as prop.
    }

    setActiveSources(restored)
  }

  const handleDeleteLayout = (layoutId: string) => {
    deleteLayout(layoutId)
    setSavedLayouts(loadLayouts())
  }

  const handleReplaceMissingSource = async (instanceId: string) => {
    try {
      const sources = await fetchUnifiedSources()
      setPickerSources(sources)
      setReplaceInstanceId(instanceId)
      setShowPicker(true)
    } catch (e) {}
  }

  const handleBringToFront = (instanceId: string) => {
    const sorted = [...activeSources].sort((a, b) => a.layerOrder - b.layerOrder)
    const others = sorted.filter(s => s.instanceId !== instanceId)
    const target = sorted.find(s => s.instanceId === instanceId)
    if (!target) return

    const reordered = [...others, target].map((s, idx) => ({
      ...s,
      layerOrder: idx + 1
    }))

    setActiveSources(reordered)
  }

  const sortedSources = [...activeSources].sort((a, b) => a.layerOrder - b.layerOrder)

  return (
    <div className="w-screen h-screen bg-background text-foreground flex flex-col overflow-hidden transition-colors duration-500">
      {/* Unified Toolbar */}
      <CompositorToolbar
        visible={isFocused}
        layers={activeSources.map(s => ({
          instanceId: s.instanceId!,
          name: s.name,
          layerOrder: s.layerOrder,
          isMissing: s.isMissing,
          appIcon: s.appIcon,
        }))}
        onReorderLayer={handleReorderLayer}
        onCloseLayer={handleDismissSource}
        savedLayouts={savedLayouts}
        onSaveLayout={handleSaveLayout}
        onLoadLayout={handleLoadLayout}
        onDeleteLayout={handleDeleteLayout}
        onAddSource={handleOpenPicker}
        onLayoutsChanged={() => setSavedLayouts(loadLayouts())}
      />

      {/* Composition Area */}
      <div className="flex-1 relative overflow-hidden bg-radial-theme transition-[background] duration-500">
        {activeSources.length === 0 && !showPicker && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#555]">
            Click "+" to add a window
          </div>
        )}

        {sortedSources.map((source, idx) => (
          <Rnd
            key={source.instanceId}
            size={{ width: source.width, height: source.height }}
            position={{ x: source.x, y: source.y }}
            onDragStop={(_e, d) => handleUpdateSource(source.instanceId!, { x: d.x, y: d.y })}
            onResizeStop={(_e, _direction, ref, _delta, position) => {
              handleUpdateSource(source.instanceId!, {
                width: Number(ref.style.width.replace('px', '')),
                height: Number(ref.style.height.replace('px', '')),
                ...position,
              })
            }}
            bounds="parent"
            dragHandleClassName={isModifierPressed ? "" : "drag-handle"}
            enableUserSelectHack={false} 
            resizeHandleComponent={{
              topRight: <div onDoubleClick={() => handleLayout(source.instanceId!, 'real-size')} className="w-full h-full" />,
              topLeft: <div onDoubleClick={() => handleLayout(source.instanceId!, 'real-size')} className="w-full h-full" />,
              bottomRight: <div onDoubleClick={() => handleLayout(source.instanceId!, 'real-size')} className="w-full h-full" />,
              bottomLeft: <div onDoubleClick={() => handleLayout(source.instanceId!, 'real-size')} className="w-full h-full" />,
            }}
            style={{ 
              zIndex: 10 + idx,
              opacity: hoveredInstanceId 
                ? (hoveredInstanceId === source.instanceId ? 0.9 : 0.4) 
                : (isFocused ? 0.9 : 0.7),
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <div 
              className={clsx(
                "w-full h-full flex flex-col bg-black overflow-hidden border border-[#333]",
                isModifierPressed ? "cursor-move" : "cursor-default"
              )}
              onMouseEnter={() => setHoveredInstanceId(source.instanceId!)}
              onMouseLeave={() => setHoveredInstanceId(null)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                handleBringToFront(source.instanceId!)
              }}
            >
              {source.isMissing ? (
                <MissingSourcePlaceholder 
                  source={source}
                  availableSources={pickerSources}
                  onReplace={() => handleReplaceMissingSource(source.instanceId!)}
                  onDismiss={() => handleDismissSource(source.instanceId!)}
                  onSwitch={(newId) => handleSwitchSource(source.instanceId!, newId)}
                  onLayout={(type) => handleLayout(source.instanceId!, type)}
                  isWindowFocused={isFocused}
                />
              ) : (
                <ComposableSourceContent 
                  source={source} 
                  availableSources={pickerSources}
                  onDismiss={() => handleDismissSource(source.instanceId!)}
                  onSwitch={(newId) => handleSwitchSource(source.instanceId!, newId)}
                  onLayout={(type) => handleLayout(source.instanceId!, type)}
                  onViewModeChange={(mode) => handleUpdateSource(source.instanceId!, { viewMode: mode })}
                  onScaleChange={(scale) => handleUpdateSource(source.instanceId!, { scale })}
                  onPanChange={(pan) => handleUpdateSource(source.instanceId!, { pan })}
                  onNativeDimensions={(w, h) => {
                    // Auto-resize to 1:1 (Logical CSS Pixels) if it's currently at default size
                    const dpr = window.devicePixelRatio || 1
                    if (source.width === 400 && source.height === 300) {
                      const P = 40 // Padding to keep it on screen
                      const logicalW = w / dpr
                      const logicalH = h / dpr
                      
                      const layoutW = Math.min(logicalW, window.innerWidth - P)
                      const layoutH = Math.min(logicalH, window.innerHeight - P)
                      
                      handleUpdateSource(source.instanceId!, { 
                        nativeWidth: w, 
                        nativeHeight: h,
                        width: layoutW,
                        height: layoutH,
                        x: (window.innerWidth - layoutW) / 2, // Center it
                        y: (window.innerHeight - layoutH) / 2
                      })
                    } else {
                      handleUpdateSource(source.instanceId!, { nativeWidth: w, nativeHeight: h })
                    }
                  }}
                  isWindowFocused={isFocused}
                  isHovered={hoveredInstanceId === source.instanceId}
                  isModifierPressed={isModifierPressed}
                />
              )}
            </div>
          </Rnd>
        ))}
      </div>

      {/* Source Picker Modal */}
      {showPicker && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100]"
          onClick={() => { setShowPicker(false); setReplaceInstanceId(null); }}
        >
          <div 
            className="bg-[#1a1a1a] w-[80vw] max-w-[1000px] h-[80vh] rounded-xl border border-[#333] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#333] flex justify-between items-center">
              <h3 className="m-0 text-white font-medium">
                {replaceInstanceId ? 'Select Replacement Source' : 'Select a Source'}
              </h3>
              <button 
                onClick={() => { setShowPicker(false); setReplaceInstanceId(null); }}
                className="bg-transparent border-none text-[#888] cursor-pointer hover:text-white"
              >✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#111]">
               <SourcePicker 
                  sources={pickerSources} 
                  onSelect={handleAddSource} 
               />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MissingSourcePlaceholder({ 
  source, 
  availableSources,
  onReplace, 
  onDismiss,
  onSwitch,
  onLayout,
  isWindowFocused 
}: { 
  source: ComposableSource
  availableSources: Source[]
  onReplace: () => void
  onDismiss: () => void
  onSwitch: (id: string) => void
  onLayout: (type: LayoutType) => void
  isWindowFocused: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="w-full h-full relative bg-white/10 flex flex-col items-center justify-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-4xl">⚠️</span>
      <div className="text-center px-5">
        <div className="text-sm font-medium text-white/90">
          Source Not Found
        </div>
        <div className="text-xs text-white/50 mt-1">
          {source.name}
        </div>
      </div>
      <button
        onClick={onReplace}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
      >
        Select New Source
      </button>

      {/* Use SourceControls for consistent toolbar */}
      <SourceControls
        sourceName={source.name + ' (Missing)'}
        scale={1}
        onScaleChange={() => {}}
        onDismiss={onDismiss}
        onSwitch={onSwitch}
        availableSources={availableSources}
        onLayout={onLayout}
        viewMode="manual"
        onViewModeChange={() => {}}
        visible={isWindowFocused || isHovered}
      />
    </div>
  )
}

function ComposableSourceContent({ 
  source, 
  availableSources, 
  onDismiss, 
  onSwitch,
  onLayout,
  onViewModeChange,
  onScaleChange,
  onPanChange,
  onNativeDimensions,
  isHovered,
  isModifierPressed
}: { 
  source: ComposableSource,  
  availableSources: Source[], 
  onDismiss: () => void, 
  onSwitch: (id: string) => void,
  onLayout: (type: LayoutType) => void,
  onViewModeChange: (mode: ViewMode) => void,
  onScaleChange: (scale: number) => void,
  onPanChange: (pan: { x: number; y: number }) => void,
  onNativeDimensions: (width: number, height: number) => void,
  isWindowFocused: boolean,
  isHovered?: boolean,
  isModifierPressed?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle legacy/undefined viewMode
  const viewMode = source.viewMode || 'manual'
  const scale = source.scale ?? 1 / (window.devicePixelRatio || 1)
  const pan = source.pan ?? { x: 0, y: 0 }
  
  // Internal pan state
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const onWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'manual') return
    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey) {
      // Pinch to zoom
      const delta = -e.deltaY * 0.01
      const newScale = Math.min(5, Math.max(0.1, scale + delta))
      onScaleChange(newScale)
    } else {
      // Pan
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY
      })
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: source.id,
              cursor: 'never'
            }
          } as any
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = async () => {
            try {
              if (videoRef.current) {
                const w = videoRef.current.videoWidth
                const h = videoRef.current.videoHeight
                onNativeDimensions(w, h)
              }
              await videoRef.current?.play()
              setError(null)
            } catch (e) {
              console.error('Play failed', e)
              setError('Failed to play stream')
            }
          }
        }
      } catch (e) {
        console.error('Stream failed', e)
        setError('Failed to load stream')
      }
    }
    start()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [source.id])

  // Internal Pan logic
  const contentFits = Math.abs(scale - 1) < 0.01 && 
    source.nativeWidth && Math.abs(source.width - source.nativeWidth) < 20 && 
    source.nativeHeight && Math.abs(source.height - source.nativeHeight) < 20

  const canPan = viewMode === 'manual' && !contentFits

  const onMouseDown = (e: React.MouseEvent) => {
    if (!canPan) return
    if (e.metaKey || e.ctrlKey) return // Allow Rnd to handle window drag
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('.source-switcher') ||
        (e.target as HTMLElement).closest('.drag-handle')) return

    setIsDragging(true)
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    onPanChange({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const onMouseUp = () => setIsDragging(false)



  return (
    <div 
      className="w-full h-full relative group overflow-hidden bg-black"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 bg-red-900/20 text-sm">
          {error}
        </div>
      ) : (
        <div 
          style={{
            // In manual mode, size the wrapper to the source's native (physical) dimensions
            // This ensures scale(1) = 1 physical pixel per CSS pixel
            width: viewMode === 'manual' && source.nativeWidth ? source.nativeWidth : '100%',
            height: viewMode === 'manual' && source.nativeHeight ? source.nativeHeight : '100%',
            cursor: isDragging ? 'grabbing' : (canPan && !isModifierPressed ? 'grab' : 'default'),
            transform: viewMode === 'manual' 
              ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})` 
              : undefined,
            transformOrigin: '0 0',
            opacity: isModifierPressed ? 0.6 : 1, 
            transition: isDragging ? 'none' : 'opacity 0.2s',
          }}
        >
           <video 
            ref={videoRef}
            className="pointer-events-none select-none"
            style={{ 
              width: '100%', 
              height: '100%',
              maxWidth: 'none',
              maxHeight: 'none',
              objectFit: viewMode === 'manual' ? 'fill' : (viewMode as any),
            }}
            autoPlay 
            muted 
          />
        </div>
      )}

      {/* Controls Overlay */}
      <SourceControls 
        sourceName={source.name}
        scale={scale}
        onScaleChange={onScaleChange}
        onDismiss={onDismiss}
        onSwitch={onSwitch}
        availableSources={availableSources}
        onLayout={onLayout}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        visible={!!(isHovered || isDragging)}
      />
    </div>
  )
}
