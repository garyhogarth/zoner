import { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'

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
  
  // Saved layouts
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([])
  
  // Window focus state for UI visibility
  const [isFocused, setIsFocused] = useState(true)

  // Load saved layouts on mount
  useEffect(() => {
    setSavedLayouts(loadLayouts())
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
      scale: 1 / (window.devicePixelRatio || 1),  // DPR-based default for proper display
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
        ? { ...newSource, instanceId: s.instanceId, x: s.x, y: s.y, width: s.width, height: s.height, scale: s.scale, pan: s.pan, viewMode: s.viewMode, layerOrder: s.layerOrder, isMissing: false }
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

    switch (type) {
      case 'full':
        updates = { x: P, y: P, width: W - P * 2, height: H - P * 2 }
        break
      case 'left':
        updates = { x: P, y: P, width: W / 2 - P * 1.5, height: H - P * 2 }
        break
      case 'right':
        updates = { x: W / 2 + P / 2, y: P, width: W / 2 - P * 1.5, height: H - P * 2 }
        break
      case 'top-left':
        updates = { x: P, y: P, width: W / 2 - P * 1.5, height: H / 2 - P * 1.5 }
        break
      case 'top-right':
        updates = { x: W / 2 + P / 2, y: P, width: W / 2 - P * 1.5, height: H / 2 - P * 1.5 }
        break
      case 'bottom-left':
        updates = { x: P, y: H / 2 + P / 2, width: W / 2 - P * 1.5, height: H / 2 - P * 1.5 }
        break
      case 'bottom-right':
        updates = { x: W / 2 + P / 2, y: H / 2 + P / 2, width: W / 2 - P * 1.5, height: H / 2 - P * 1.5 }
        break
      case 'center':
        updates = { x: (W - 600) / 2, y: (H - 450) / 2, width: 600, height: 450 }
        break
      case 'real-size': {
        // Size window to match source's native video dimensions exactly
        const source = activeSources.find(s => s.instanceId === instanceId)
        console.log('Real-size for source:', source?.name, 'native:', source?.nativeWidth, 'x', source?.nativeHeight)
        
        if (source?.nativeWidth && source?.nativeHeight) {
          const dpr = window.devicePixelRatio || 1
          // Use native dimensions directly (they're already in logical/CSS pixels)
          const targetW = source.nativeWidth
          const targetH = source.nativeHeight
          // Clamp to compositor window with padding
          const maxW = W - P * 2
          const maxH = H - P * 2
          const clampedW = Math.min(targetW, maxW)
          const clampedH = Math.min(targetH, maxH)
          
          updates = { 
            width: clampedW,
            height: clampedH,
            x: (W - clampedW) / 2,
            y: (H - clampedH) / 2,
            scale: 1 / dpr,  // Keep DPR-based scale for proper rendering
            pan: { x: 0, y: 0 },
            viewMode: 'manual'
          }
          console.log('Applied real-size:', updates)
        } else {
          console.log('Native dimensions not yet available')
          updates = { 
            scale: 1 / (window.devicePixelRatio || 1),
            pan: { x: 0, y: 0 },
            viewMode: 'manual'
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
      // Swap layer orders with the one above
      const aboveId = sorted[index - 1].instanceId
      const currentOrder = sorted[index].layerOrder
      const aboveOrder = sorted[index - 1].layerOrder
      
      setActiveSources(activeSources.map(s => {
        if (s.instanceId === instanceId) return { ...s, layerOrder: aboveOrder }
        if (s.instanceId === aboveId) return { ...s, layerOrder: currentOrder }
        return s
      }))
    } else if (direction === 'down' && index < sorted.length - 1) {
      // Swap layer orders with the one below
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

  // Save current layout
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

  // Load a saved layout
  const handleLoadLayout = (layoutId: string) => {
    const layout = getLayout(layoutId)
    if (!layout) return

    // Resize window via IPC if available
    try {
      // @ts-ignore
      window.ipcRenderer?.send('resize-window', layout.windowSize)
    } catch (e) {}

    // Restore sources, marking missing ones
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
        // Missing source - create placeholder
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

    setActiveSources(restored)
  }

  // Delete a layout
  const handleDeleteLayout = (layoutId: string) => {
    deleteLayout(layoutId)
    setSavedLayouts(loadLayouts())
  }

  // Open picker to replace a missing source
  const handleReplaceMissingSource = async (instanceId: string) => {
    try {
      const sources = await fetchUnifiedSources()
      setPickerSources(sources)
      setReplaceInstanceId(instanceId)
      setShowPicker(true)
    } catch (e) {}
  }

  // Sort sources by layer order for rendering (lower = back, higher = front)
  const sortedSources = [...activeSources].sort((a, b) => a.layerOrder - b.layerOrder)

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#111',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Unified Toolbar (top-left, shows on focus) */}
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
      />

      {/* Composition Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, #222 0%, #111 100%)',
      }}>
        {activeSources.length === 0 && !showPicker && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: '#555',
          }}>
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
            dragHandleClassName="drag-handle"
            style={{ zIndex: 10 + idx }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: '#000',
              overflow: 'hidden',
              border: '1px solid #333',
            }}>
              {source.isMissing ? (
                <MissingSourcePlaceholder 
                  source={source}
                  onReplace={() => handleReplaceMissingSource(source.instanceId!)}
                  onDismiss={() => handleDismissSource(source.instanceId!)}
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
                  onNativeDimensions={(w, h) => handleUpdateSource(source.instanceId!, { nativeWidth: w, nativeHeight: h })}
                  isWindowFocused={isFocused}
                />
              )}
            </div>
          </Rnd>
        ))}
      </div>

      {/* Source Picker Modal */}
      {showPicker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        }} onClick={() => { setShowPicker(false); setReplaceInstanceId(null); }}>
          <div style={{
            background: '#1a1a1a',
            width: '80vw',
            maxWidth: '1000px',
            height: '80vh',
            borderRadius: '12px',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>
                {replaceInstanceId ? 'Select Replacement Source' : 'Select a Source'}
              </h3>
              <button 
                onClick={() => { setShowPicker(false); setReplaceInstanceId(null); }}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#111' }}>
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

// Missing source placeholder
function MissingSourcePlaceholder({ 
  source, 
  onReplace, 
  onDismiss,
  isWindowFocused 
}: { 
  source: ComposableSource
  onReplace: () => void
  onDismiss: () => void
  isWindowFocused: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '32px' }}>⚠️</span>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          Source Not Found
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
          {source.name}
        </div>
      </div>
      <button
        onClick={onReplace}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        Select New Source
      </button>

      {/* Toolbar for drag handle + close */}
      <div 
        className="drag-handle"
        style={{
          position: 'absolute',
          top: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px 12px',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: isWindowFocused || isHovered ? 1 : 0,
          transition: 'opacity 0.2s',
          cursor: 'move',
        }}
      >
        {/* Grip */}
        <div style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
            <circle cx="1.5" cy="1.5" r="1.5" />
            <circle cx="1.5" cy="5" r="1.5" />
            <circle cx="1.5" cy="8.5" r="1.5" />
            <circle cx="4.5" cy="1.5" r="1.5" />
            <circle cx="4.5" cy="5" r="1.5" />
            <circle cx="4.5" cy="8.5" r="1.5" />
          </svg>
        </div>
        <span style={{ fontSize: '11px', color: '#fca5a5' }}>Missing</span>
        <button
          onClick={onDismiss}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            border: 'none',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Active source content with video
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
  isWindowFocused
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
  isWindowFocused: boolean
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
            }
          } as any
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = async () => {
            try {
              // Report native dimensions
              if (videoRef.current) {
                const w = videoRef.current.videoWidth
                const h = videoRef.current.videoHeight
                console.log('Video native dimensions:', w, 'x', h, 'for source:', source.id)
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
  const onMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'manual') return
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('.source-switcher') ||
        (e.target as HTMLElement).closest('.drag-handle')) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    onPanChange({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const onMouseUp = () => setIsDragging(false)

  return (
    <div 
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div style={{
          transform: viewMode === 'manual' ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})` : 'none',
          transformOrigin: 'top left',
          willChange: 'transform',
          width: viewMode === 'manual' ? 'fit-content' : '100%',
          height: viewMode === 'manual' ? 'fit-content' : '100%',
      }}>
        {error ? (
            <div style={{ padding: '20px', color: '#ff6b6b' }}>{error}</div>
        ) : (
            <video 
            ref={videoRef} 
            style={{ 
                display: 'block', 
                maxWidth: 'none', 
                maxHeight: 'none',
                width: viewMode === 'manual' ? 'auto' : '100%',
                height: viewMode === 'manual' ? 'auto' : '100%',
                objectFit: viewMode === 'manual' ? undefined : (viewMode === 'stretch' ? 'fill' : viewMode),
                position: viewMode === 'manual' ? 'static' : 'absolute',
                inset: 0
            }} 
            draggable={false}
            />
        )}
      </div>

      <SourceControls 
        sourceName={source.name}
        scale={scale}
        onScaleChange={onScaleChange}
        onDismiss={onDismiss}
        onSwitch={onSwitch}
        onLayout={onLayout}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        visible={isWindowFocused}
        availableSources={availableSources}
      />
    </div>
  )
}
