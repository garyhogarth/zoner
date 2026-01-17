import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export function Preview() {
  const [params] = useSearchParams()
  const sourceId = params.get('sourceId')
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Panning state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Window focus state for toolbar visibility
  const [isFocused, setIsFocused] = useState(true)

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

  useEffect(() => {
    if (!sourceId) return

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
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
          }
        }
      } catch (e) {
        console.error('Stream error:', e)
        alert('Failed to get stream. Check permissions.')
      }
    }

    startStream()
  }, [sourceId])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setPan({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 5))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.1))

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden"
      style={{ position: 'fixed', inset: 0 }}
    >
      {/* Layer 1: Video (lowest) */}
      <div 
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ zIndex: 1 }}
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            width: 'fit-content',
            height: 'fit-content',
            willChange: 'transform',
          }}
          className="transition-transform duration-75 ease-out"
        >
          <video 
            ref={videoRef}
            style={{
              display: 'block',
              maxWidth: 'none', 
              maxHeight: 'none',
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Layer 2: Region Box Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ zIndex: 10 }}
      >
        <div className="w-[100px] h-[100px] border-2 border-dotted border-white/80 shadow-sm relative">
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500/50 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Layer 3: Floating Control Bar - Fades on blur */}
      <div 
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2147483647,
          pointerEvents: isFocused ? 'auto' : 'none',
          opacity: isFocused ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            padding: '8px 16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Link 
            to="/" 
            style={{
              color: 'white',
              fontWeight: 500,
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            ← Back
          </Link>
          
          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          
          <button 
            onClick={handleZoomOut}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              color: 'white',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
            title="Zoom Out"
          >
            −
          </button>
          
          <div style={{ color: 'white', fontSize: '14px', minWidth: '50px', textAlign: 'center', fontFamily: 'monospace' }}>
            {Math.round(scale * 100)}%
          </div>

          <button 
            onClick={handleZoomIn}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              color: 'white',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
            title="Zoom In"
          >
            +
          </button>
          
          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sourceId || ''}>
            {sourceId}
          </div>
        </div>
      </div>
    </div>
  )
}


