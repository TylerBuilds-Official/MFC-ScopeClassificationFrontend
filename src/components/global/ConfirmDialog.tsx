import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import '../../styles/confirm-dialog.css'


interface ConfirmDialogProps {
  open:          boolean
  title:         string
  message:       string
  confirmLabel?: string
  cancelLabel?:  string
  variant?:      'danger' | 'default'
  onConfirm:     () => void
  onCancel:      () => void
}


export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    confirmRef.current?.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', handleKey)

    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-body">
          {variant === 'danger' && (
            <div className="confirm-icon danger">
              <AlertTriangle size={20} />
            </div>
          )}
          <div className="confirm-text">
            <h3 className="confirm-title">{title}</h3>
            <p className="confirm-message">{message}</p>
          </div>
        </div>

        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`confirm-btn ${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
