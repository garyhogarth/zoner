import { createPortal } from 'react-dom'
import { useEffect, useState, useRef } from 'react'

interface MenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  triggerRef: React.RefObject<any>
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
}

export function Menu({ isOpen, onClose, children, className = '', triggerRef, placement = 'bottom-start' }: MenuProps) {
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use layout effect to avoid visual flakiness
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const calculatePosition = () => {
        const rect = triggerRef.current!.getBoundingClientRect()
        let top = 0
        let left = 0

        // Vertical
        if (placement.startsWith('bottom')) {
          top = rect.bottom + 4
        } else {
          // For top placement, we need to know our own height
          const menuHeight = menuRef.current?.offsetHeight || 0
          top = rect.top - 4 - menuHeight
        }

        // Horizontal
        if (placement.endsWith('start')) {
          left = rect.left
        } else {
          left = rect.right
        }
        
        setPosition({ top, left })
      }
      
      // Calculate immediately
      // For 'top' placement, we need to wait for render to get height, 
      // but we can try closely. 
      // Better strategy: Render via Portal invisibly, measure, then position.
      // Current simplication: Run calc, and if we are 'top', run it again after mount check?
      // Actually, standard useEffect runs after paint. 
      // We will loop a RequestAnimationFrame to ensure we catch the height? No.
      calculatePosition()

      // Observers
      window.addEventListener('scroll', calculatePosition, true)
      window.addEventListener('resize', calculatePosition)
      
      // If we are placing 'top', we need to re-calc whenever children/layout changes height
      const observer = new ResizeObserver(() => calculatePosition())
      if (menuRef.current) observer.observe(menuRef.current)

      return () => {
        window.removeEventListener('scroll', calculatePosition, true)
        window.removeEventListener('resize', calculatePosition)
        observer.disconnect()
      }
    } else {
      setPosition(null)
    }
  }, [isOpen, placement, triggerRef, children])

  if (!isOpen) return null

  // Don't render visible until positioned if we need height for 'top'
  // Actually, we need to render to get height.
  // So we render with opacity 0 if position is unset or if we suspect it's wrong?
  // Simplest: Just render. The previous bug was cumulative setPosition.
  // Now we calculate absolute 'top' every time.
  
  const style: React.CSSProperties = {
    top: position?.top ?? 0,
    left: placement.endsWith('end') ? undefined : (position?.left ?? 0),
    right: placement.endsWith('end') ? (window.innerWidth - (position?.left ?? 0)) : undefined,
    opacity: position ? 1 : 0, // Hide until positioned
    visibility: position ? 'visible' : 'hidden',
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
      />
      <div 
        ref={menuRef}
        style={style}
        className={`fixed z-[9999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[180px] py-1 ${className}`}
        onWheel={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

interface MenuItemProps {
  icon?: React.ReactNode
  label: React.ReactNode
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  shortcut?: string
  hasSubmenu?: boolean
  className?: string
}

export function MenuItem({ icon, label, onClick, active, disabled, shortcut, hasSubmenu, className = '' }: MenuItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors
        ${active ? 'bg-blue-600/20 text-blue-200' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span className="w-4 h-4 flex items-center justify-center opacity-70">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-xs text-zinc-500 ml-2">{shortcut}</span>}
      {hasSubmenu && <span className="opacity-50">›</span>}
    </button>
  )
}

export function MenuSeparator() {
  return <div className="h-px bg-zinc-800 my-1 mx-2" />
}

export function MenuHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{children}</div>
}
