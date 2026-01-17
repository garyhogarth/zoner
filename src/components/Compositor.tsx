import { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'

interface Source {
  id: string
  name: string
  thumbnail: string
  appIcon?: string | null
  instanceId?: string
}

export function Compositor() {
  const [activeSources, setActiveSources] = useState<Source[]>([])
  const [pickerSources, setPickerSources] = useState<Source[]>([])
  const [showPicker, setShowPicker] = useState(false)

  // Fetch sources on mount so they are available for switchers too
  useEffect(() => {
    const fetch = async () => {
      try {
        // @ts-ignore
        const sources = await window.ipcRenderer.invoke('get-sources')
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
      // @ts-ignore
      const sources = await window.ipcRenderer.invoke('get-sources')
      setPickerSources(sources)
      setShowPicker(true)
    } catch (e) {}
  }

  const handleAddSource = (source: Source) => {
    const instanceId = Date.now().toString() + Math.random().toString().slice(2, 5)
    setActiveSources([...activeSources, { ...source, instanceId }])
    setShowPicker(false)
  }

  const handleDismissSource = (instanceId: string) => {
    setActiveSources(activeSources.filter(s => s.instanceId !== instanceId))
  }

  const handleSwitchSource = (instanceId: string, newSourceId: string) => {
    const newSource = pickerSources.find(s => s.id === newSourceId)
    if (!newSource) return
    setActiveSources(activeSources.map(s => 
      s.instanceId === instanceId ? { ...newSource, instanceId: s.instanceId } : s
    ))
  }

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
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        zIndex: 50,
      }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>Compositor Prototype</h1>
        <button 
          onClick={handleOpenPicker}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          + Add Source
        </button>
      </header>

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
            Click "+ Add Source" to begin composition.
          </div>
        )}

        {activeSources.map((source) => (
          <Rnd
            key={source.instanceId}
            default={{
              x: 50,
              y: 50,
              width: 400,
              height: 300,
            }}
            bounds="parent"
            dragHandleClassName="drag-handle"
            style={{ zIndex: 10 }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: '#000',
              overflow: 'hidden',
              // No border radius or specific border requested, but minimal border helps visibility against dark bg
              border: '1px solid #333',
            }}>
              <ComposableSourceContent 
                source={source} 
                availableSources={pickerSources}
                onDismiss={() => handleDismissSource(source.instanceId!)}
                onSwitch={(newId) => handleSwitchSource(source.instanceId!, newId)}
              />
            </div>
          </Rnd>
        ))}
      </div>

      {/* Source Picker Modal content same as before ... */}
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
        }} onClick={() => setShowPicker(false)}>
          <div style={{
            background: '#1a1a1a',
            width: '600px',
            maxHeight: '80vh',
            borderRadius: '12px',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Select a Source</h3>
              <button 
                onClick={() => setShowPicker(false)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {pickerSources.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleAddSource(s)}
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '0',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ height: '80px', background: '#000', width: '100%' }}>
                    {s.thumbnail && <img src={s.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </div>
                  <div style={{ padding: '8px', fontSize: '11px', color: '#ccc', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComposableSourceContent({ 
  source, 
  availableSources, 
  onDismiss, 
  onSwitch 
}: { 
  source: Source, 
  availableSources: Source[], 
  onDismiss: () => void, 
  onSwitch: (id: string) => void 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  
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
          videoRef.current.play()
        }
      } catch (e) {
        console.error('Stream failed', e)
      }
    }
    start()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [source.id])

  // Internal Pan logic
  const onMouseDown = (e: React.MouseEvent) => {
    // Only pan if NOT clicking a button/interactive element
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.source-switcher')) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const onMouseUp = () => setIsDragging(false)

  return (
    <div 
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowSwitcher(false); }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          willChange: 'transform',
      }}>
        <video 
          ref={videoRef} 
          style={{ display: 'block', maxWidth: 'none', maxHeight: 'none' }} 
          draggable={false}
        />
      </div>

      {/* Unified Toolbar (Top Center) */}
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
          opacity: isHovered || showSwitcher ? 1 : 0,
          transition: 'opacity 0.2s',
          cursor: 'move', // Indicates drag-ability
        }}
        onMouseDown={e => {
            // Allow drag unless clicking buttons
            if ((e.target as HTMLElement).closest('button')) e.stopPropagation()
        }}
      >
        {/* Grip Handle */}
        <div style={{ color: 'rgba(255,255,255,0.4)', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor">
            <circle cx="1.5" cy="1.5" r="1.5" />
            <circle cx="1.5" cy="5" r="1.5" />
            <circle cx="1.5" cy="8.5" r="1.5" />
            <circle cx="4.5" cy="1.5" r="1.5" />
            <circle cx="4.5" cy="5" r="1.5" />
            <circle cx="4.5" cy="8.5" r="1.5" />
          </svg>
        </div>

        {/* Source Name & Switcher */}
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setShowSwitcher(!showSwitcher)}
                className="source-switcher"
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    maxWidth: '120px',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {source.name}
                </span>
                <span style={{ fontSize: '8px' }}>▼</span>
            </button>
            
            {showSwitcher && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    width: '200px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '4px',
                    zIndex: 200,
                }} onMouseDown={e => e.stopPropagation()}>
                    {/* Add basic search/list */}
                    {availableSources.map(s => (
                        <button
                            key={s.id}
                            onClick={() => { onSwitch(s.id); setShowSwitcher(false); }}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '6px 8px',
                                background: s.id === source.id ? '#3b82f6' : 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '11px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {s.appIcon ? <img src={s.appIcon} style={{ width: 12, height: 12 }} /> : <span>📺</span>}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>-</button>
            <span style={{ fontSize: '10px', color: '#ccc', minWidth: '28px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: 'none', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>+</button>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Close Button */}
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
            title="Remove"
        >
            ✕
        </button>
      </div>
    </div>
  )
}
