import { useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export function Preview() {
  const [params] = useSearchParams()
  const sourceId = params.get('sourceId')
  const videoRef = useRef<HTMLVideoElement>(null)

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
            //   minWidth: 1280,
            //   maxWidth: 4000,
            //   minHeight: 720,
            //   maxHeight: 4000,
            }
          } as any
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play()
          }
        }
      } catch (e) {
        console.error('Stream error:', e)
        alert('Failed to get stream. Check permissions.')
      }
    }

    startStream()
  }, [sourceId])

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden group">
      {/* Overlay Header - fades out when not hovering possibly, or just stays */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <Link to="/" className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded backdrop-blur-sm transition-colors text-sm font-medium">
            ← Back
          </Link>
          <div className="text-xs text-white/50 pointer-events-auto bg-black/30 px-2 py-0.5 rounded">{sourceId}</div>
      </div>
      
      {/* Video Container - Explicit Debugging Styles */}
      <div 
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
            backgroundColor: 'black'
        }}
      >
        <video 
           ref={videoRef}
           style={{
               width: '100%',
               height: '100%',
               objectFit: 'contain'
           }}
        />
      </div>
    </div>
  )
}

