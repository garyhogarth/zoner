import { useState, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'

export function Compositor() {
  const [activeSources, setActiveSources] = useState<any[]>([])
  const [pickerSources, setPickerSources] = useState<any[]>([])
  const [showPicker, setShowPicker] = useState(false)

  const handleOpenPicker = async () => {
    try {
      // @ts-ignore
      const sources = await window.ipcRenderer.invoke('get-sources')
      setPickerSources(sources)
      setShowPicker(true)
    } catch (e) {
      console.error('Failed to get sources', e)
    }
  }

  const handleAddSource = (source: any) => {
    // Add unique ID to allow multiple instances of same source
    const instanceId = Date.now().toString()
    setActiveSources([...activeSources, { ...source, instanceId }])
    setShowPicker(false)
  }

  const handleDismissSource = (instanceId: string) => {
    setActiveSources(activeSources.filter(s => s.instanceId !== instanceId))
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

      {/* Composition Area - Relative for Rnd positioning */}
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
              border: '1px solid #444',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}>
              {/* Header / Drag Handle */}
              <div 
                className="drag-handle"
                style={{
                  padding: '6px 10px',
                  background: '#222',
                  borderBottom: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'move',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                  {source.name}
                </div>
                <button 
                  onClick={() => handleDismissSource(source.instanceId)}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '0 4px',
                  }}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              {/* Content Area with Internal Pan/Zoom */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <ComposableSourceContent sourceId={source.id} />
              </div>
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

function ComposableSourceContent({ sourceId }: { sourceId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
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
              chromeMediaSourceId: sourceId,
            }
          } as any
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play()
             setPan({ x: 0, y: 0 })
             setScale(1 / (window.devicePixelRatio || 1))
          }
        }
      } catch (e) {
        console.error('Stream failed', e)
      }
    }
    start()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [sourceId])



  const onMouseDown = (e: React.MouseEvent) => {
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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
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

       {/* Internal Controls Overlay */}
       <div style={{
         position: 'absolute',
         bottom: '8px',
         right: '8px',
         display: 'flex',
         gap: '4px',
         background: 'rgba(0,0,0,0.6)',
         borderRadius: '4px',
         padding: '4px'
       }}
       onMouseDown={e => e.stopPropagation()} // Prevent pan drag start
       >
         <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
         <span style={{ fontSize: '10px', color: 'white', alignSelf: 'center' }}>{Math.round(scale * 100)}%</span>
         <button onClick={() => setScale(s => Math.min(5, s + 0.1))} style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
       </div>
    </div>
  )
}
