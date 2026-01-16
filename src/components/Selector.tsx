import { useState, useEffect } from 'react'

export function Selector() {
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPoint({ x: e.clientX, y: e.clientY })
    setIsDragging(true)
    setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startPoint) return

    const currentX = e.clientX
    const currentY = e.clientY

    const x = Math.min(startPoint.x, currentX)
    const y = Math.min(startPoint.y, currentY)
    const width = Math.abs(currentX - startPoint.x)
    const height = Math.abs(currentY - startPoint.y)

    setRect({ x, y, width, height })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (rect && rect.width > 0 && rect.height > 0) {
        // Send to main process
        console.log('Selected:', rect)
        // @ts-ignore
        window.ipcRenderer.send('region-selected', rect)
    }
    setStartPoint(null)
  }
  
  // Cancel on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
             // @ts-ignore
            window.ipcRenderer.send('selection-cancelled')
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div 
      className="w-screen h-screen cursor-crosshair relative overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ background: 'rgba(0, 0, 0, 0.01)' }} // Nearly transparent to catch events
    >
      {rect && (
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            border: '2px solid #00ff00',
            background: 'rgba(0, 0, 0, 0)', // This is the hole
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)', // Dim everything else
          }}
        >
             <div className="absolute -top-6 left-0 bg-green-500 text-black text-xs px-1">
                 {Math.round(rect.width)} x {Math.round(rect.height)}
             </div>
        </div>
      )}
      
      {!isDragging && !rect && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl drop-shadow-md pointer-events-none">
              Click and drag to select region
          </div>
      )}
    </div>
  )
}
