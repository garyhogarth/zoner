import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'

import { fetchUnifiedSources, type Source } from '../utils/sources'

// Dropdown item with truncation + marquee on hover + thumbnail + appIcon
function DropdownItem({ name, thumbnail, appIcon, isActive, onClick }: { name: string, thumbnail?: string, appIcon?: string | null, isActive: boolean, onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldScroll, setShouldScroll] = useState(false)
  
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth)
    }
  }, [name])
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '6px 12px',
        textAlign: 'left',
        background: isActive ? 'rgba(59, 130, 246, 0.3)' : isHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail + App Icon */}
      {thumbnail && (
        <div style={{
          position: 'relative',
          width: '28px',
          height: '28px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
            <img 
              src={thumbnail} 
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          {appIcon && (
            <img
              src={appIcon}
              alt=""
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
                backgroundColor: '#222',
              }}
            />
          )}
        </div>
      )}
      <div 
        ref={containerRef}
        style={{ 
          overflow: 'hidden', 
          position: 'relative',
          maxWidth: '140px',
          flex: 1,
        }}
      >
        <span
          ref={textRef}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: isHovered && shouldScroll ? 'marquee 4s linear infinite' : 'none',
          }}
        >
          {name}
        </span>
      </div>
    </button>
  )
}

export function Preview() {
  const [params] = useSearchParams()
  const sourceId = params.get('sourceId')
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()
  
  // Panning state
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1 / (window.devicePixelRatio || 1))
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Window focus state for toolbar visibility
  const [isFocused, setIsFocused] = useState(true)
  
  // Source dropdown state
  const [sources, setSources] = useState<Source[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [currentSourceName, setCurrentSourceName] = useState<string>('')

  // Find current source name
  useEffect(() => {
    const source = sources.find(s => s.id === sourceId)
    if (source) {
      setCurrentSourceName(source.name)
      // Notify main process
      // @ts-ignore
      window.ipcRenderer.send('set-current-source', { id: sourceId, name: source.name })
    }
  }, [sourceId, sources])

  // Fetch sources for dropdown
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const availableSources = await fetchUnifiedSources()
        setSources(availableSources)
      } catch (e) {
        console.error('Failed to fetch sources', e)
      }
    }
    fetchSources()
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

  useEffect(() => {
    if (!sourceId) return

    let currentStream: MediaStream | null = null
    let isActive = true

    const startStream = async () => {
      try {
        let stream: MediaStream
           stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
                }
            } as any
           })

        if (!isActive) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        currentStream = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play()
             setPan({ x: 0, y: 0 })
             setScale(1 / (window.devicePixelRatio || 1))
          }
        }
      } catch (e) {
        if (isActive) {
          console.error('Stream error:', e)
          alert('Failed to get stream. Check permissions.')
        }
      }
    }

    startStream()

    return () => {
      isActive = false
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
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

  const handleSourceChange = (newSourceId: string) => {
    setShowDropdown(false)
    navigate(`/preview?sourceId=${encodeURIComponent(newSourceId)}`)
  }

  const screens = sources.filter(s => s.id.startsWith('screen:'))
  const windows = sources.filter(s => s.id.startsWith('window:'))

  // Group windows by appIcon
  const groupedWindows = windows.reduce((groups, source) => {
    const iconKey = source.appIcon || 'no-icon'
    if (!groups[iconKey]) groups[iconKey] = []
    groups[iconKey].push(source)
    return groups
  }, {} as Record<string, Source[]>)

  // Sort windows within each group alphabetically
  Object.values(groupedWindows).forEach(group => {
    group.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Sort groups based on the first window's name (which is now the alphabetical first)
  const sortedIconKeys = Object.keys(groupedWindows).sort((a, b) => {
    if (a === 'no-icon') return 1
    if (b === 'no-icon') return -1
    return (groupedWindows[a][0]?.name || '').localeCompare(groupedWindows[b][0]?.name || '')
  })

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden"
      style={{ position: 'fixed', inset: 0 }}
      onClick={() => setShowDropdown(false)}
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
          
          {/* Source Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { 
                e.stopPropagation()
                setShowDropdown(!showDropdown) 
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                maxWidth: '150px',
              }}
              title={currentSourceName || sourceId || ''}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentSourceName || sourceId?.split(':')[1] || 'Select'}
              </span>
              <span style={{ fontSize: '8px' }}>▼</span>
            </button>
            
            {showDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '200px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                  padding: '8px 0',
                }}
              >
                {/* Screens */}
                <div style={{ padding: '4px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                  🖥️ SCREENS
                </div>
                {screens.map(s => (
                  <DropdownItem
                    key={s.id}
                    name={s.name}
                    thumbnail={s.thumbnail}
                    isActive={s.id === sourceId}
                    onClick={() => handleSourceChange(s.id)}
                  />
                ))}


                
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                
                {/* Windows grouped by appIcon */}
                {sortedIconKeys.map(iconKey => (
                  <div key={iconKey}>
                    {groupedWindows[iconKey].map(s => (
                      <DropdownItem
                        key={s.id}
                        name={s.name}
                        thumbnail={s.thumbnail}
                        appIcon={s.appIcon}
                        isActive={s.id === sourceId}
                        onClick={() => handleSourceChange(s.id)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



