import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export function Output() {
  const [params] = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const x = parseInt(params.get('x') || '0', 10)
  const y = parseInt(params.get('y') || '0', 10)

  useEffect(() => {
    const startCapture = async () => {
      try {
        // @ts-ignore
        const sourceId = await window.ipcRenderer.invoke('get-screen-source')
        
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
             console.log('Video loaded, dimensions:', videoRef.current?.videoWidth, videoRef.current?.videoHeight)
          }
        }
      } catch (e) {
        console.error('Error getting stream:', e)
        alert('Failed to get screen stream. Please check permissions in System Settings > Privacy > Screen Recording.')
      }
    }

    startCapture()
  }, [])

  return (
    <div className="w-full h-full overflow-hidden bg-black relative">
       <video 
          ref={videoRef}
          style={{
              position: 'fixed',
              top: `-${y}px`,
              left: `-${x}px`,
              maxWidth: 'none',
              maxHeight: 'none',
          }}
       />
    </div>
  )
}
