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
    <div className="flex flex-col h-screen bg-black">
      <div className="flex-none p-4 bg-gray-800 flex justify-between items-center text-white">
          <Link to="/" className="text-blue-400 hover:text-blue-300">← Back to Selection</Link>
          <div className="font-semibold">Previewing Source: {sourceId}</div>
      </div>
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
        <video 
           ref={videoRef}
           className="max-w-full max-h-full shadow-2xl border border-gray-700"
           style={{ objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}
