import { useState, useEffect, useCallback, useRef } from 'react'
import { Eye, CircleDot, CheckCircle, Archive, RotateCcw } from 'lucide-react'


interface ContextMenuOption {
  label:    string
  value:    string
  icon:     React.ReactNode
  color?:   string
  divider?: boolean
}

interface StatusContextMenuProps {
  currentStatus: string
  onSelect:      (status: string) => void
  children:      React.ReactNode
}


const STATUS_OPTIONS: ContextMenuOption[] = [
  { label: 'Unreviewed',   value: 'unreviewed',   icon: <CircleDot size={13} />,  color: 'var(--text-muted)' },
  { label: 'Acknowledged', value: 'acknowledged', icon: <Eye size={13} />,        color: 'var(--accent)' },
  { label: 'Addressed',    value: 'addressed',    icon: <CheckCircle size={13} />, color: 'var(--status-complete)' },
  { label: 'Dismissed',    value: 'dismissed',    icon: <Archive size={13} />,    color: 'var(--text-muted)', divider: true },
]


export default function StatusContextMenu({ currentStatus, onSelect, children }: StatusContextMenuProps) {
  const [open, setOpen]     = useState(false)
  const [pos, setPos]       = useState({ x: 0, y: 0 })
  const menuRef             = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }, [])

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Clamp menu to viewport
  useEffect(() => {
    if (!open || !menuRef.current) return

    const rect   = menuRef.current.getBoundingClientRect()
    const adjust = { x: pos.x, y: pos.y }

    if (rect.right > window.innerWidth - 8) {
      adjust.x = window.innerWidth - rect.width - 8
    }
    if (rect.bottom > window.innerHeight - 8) {
      adjust.y = window.innerHeight - rect.height - 8
    }

    if (adjust.x !== pos.x || adjust.y !== pos.y) {
      setPos(adjust)
    }
  }, [open])

  function handleSelect(value: string) {
    setOpen(false)
    if (value !== currentStatus) {
      onSelect(value)
    }
  }

  return (
    <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
      {children}

      {open && (
        <div
          ref={menuRef}
          className="status-context-menu"
          style={{ left: pos.x, top: pos.y }}
        >
          <div className="status-context-header">Set Status</div>
          {STATUS_OPTIONS.map(opt => (
            <div key={opt.value}>
              {opt.divider && <div className="status-context-divider" />}
              <button
                className={`status-context-item ${opt.value === currentStatus ? 'current' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="status-context-icon" style={{ color: opt.color }}>
                  {opt.icon}
                </span>
                <span className="status-context-label">{opt.label}</span>
                {opt.value === currentStatus && (
                  <span className="status-context-check">●</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
