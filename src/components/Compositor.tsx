import { useState, useRef, useEffect } from 'react'

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
    setActiveSources([...activeSources, source])
    setShowPicker(false)
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#111',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #333',
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
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        alignContent: 'start',
        overflowY: 'auto',
      }}>
        {activeSources.length === 0 && !showPicker ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#555', marginTop: '40px' }}>
            No sources added. Click "+ Add Source" to begin.
          </div>
        ) : (
          activeSources.map((source, index) => (
            <div key={index + '-' + source.id} style={{
              background: '#222',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', background: '#333', fontWeight: 500 }}>
                {source.name}
              </div>
              <SourcePreview sourceId={source.id} />
            </div>
          ))
        )}
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

function SourcePreview({ sourceId }: { sourceId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

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
  }, [sourceId])

  return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: 'black' }}>
      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
}
