
import { createPortal } from 'react-dom'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--popover-foreground))] mb-2">{title}</h3>
          <div className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            {description}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-[hsl(var(--muted))]/30 border-t border-[hsl(var(--border))] flex justify-end gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            size="sm" 
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xs bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <img 
            src="https://github.com/garyhogarth.png" 
            alt="Gary Hogarth"
            className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-[hsl(var(--border))]"
          />
          <h3 className="text-lg font-semibold text-[hsl(var(--popover-foreground))] mb-1">Zoner</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Multi-window compositing tool</p>
          
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            <p className="mb-2">Created by</p>
            <a 
              href="https://github.com/garyhogarth/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-[hsl(var(--foreground))] hover:underline"
            >
              Gary Hogarth
            </a>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-[hsl(var(--muted))]/30 border-t border-[hsl(var(--border))] flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

