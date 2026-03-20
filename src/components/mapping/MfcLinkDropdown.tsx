import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import type { MfcOption } from '../../types/mapping'


interface Props {
  options:           MfcOption[]
  existingMfcIds:    number[]
  defaultCategoryId: number
  onSelect:          (mfcId: number) => void
  onClose:           () => void
}


/**
 * Full-width bottom sheet for picking an MFC exclusion to link.
 * Portaled to body so it escapes table cell constraints.
 * Slides up from viewport bottom, backdrop click or Escape to close.
 */
export default function MfcLinkDropdown({
    options, existingMfcIds, defaultCategoryId,
    onSelect, onClose }: Props) {

  const [search, setSearch]         = useState('')
  const [showAll, setShowAll]       = useState(false)
  const [visible, setVisible]       = useState(false)
  const [sheetHeight, setSheetHeight] = useState<number | null>(null)
  const [dragging, setDragging]     = useState(false)
  const [collapsed, setCollapsed]   = useState<Set<string>>(new Set())
  const inputRef                    = useRef<HTMLInputElement>(null)
  const panelRef                    = useRef<HTMLDivElement>(null)

  const MIN_HEIGHT = 180
  const MAX_HEIGHT = window.innerHeight * 0.85

  // Trigger entrance animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Focus search input once visible
  useEffect(() => {
    if (visible) inputRef.current?.focus()
  }, [visible])

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)

    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // ── Drag-to-resize ──────────────────────────────────────────

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const h = window.innerHeight - e.clientY
    setSheetHeight(Math.max(MIN_HEIGHT, Math.min(h, MAX_HEIGHT)))
  }, [MAX_HEIGHT])

  const handlePointerUp = useCallback(() => {
    setDragging(false)
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove])

  function handleDragStart(e: React.PointerEvent) {
    e.preventDefault()
    setDragging(true)

    // Capture current height if this is the first drag
    if (sheetHeight === null && panelRef.current) {
      setSheetHeight(panelRef.current.offsetHeight)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  const existingSet = useMemo(() => new Set(existingMfcIds), [existingMfcIds])

  const filtered = useMemo(() => {
    let pool = options.filter(o => !existingSet.has(o.Id))

    if (!showAll) {
      pool = pool.filter(o => o.CategoryId === defaultCategoryId)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      pool = pool.filter(o =>
        o.Exclusion.toLowerCase().includes(q) ||
        o.CategoryName.toLowerCase().includes(q)
      )
    }

    return pool
  }, [options, existingSet, showAll, defaultCategoryId, search])

  // Group filtered results by category (preserves original order)
  const grouped = useMemo(() => {
    const map = new Map<string, MfcOption[]>()

    for (const opt of filtered) {
      const key = opt.CategoryName
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(opt)
    }

    return Array.from(map.entries())
  }, [filtered])

  return createPortal(
    <div className={`mfc-sheet-backdrop ${visible ? 'visible' : ''}`} onMouseDown={onClose}>
      <div
        ref={panelRef}
        className={`mfc-sheet ${visible ? 'visible' : ''} ${dragging ? 'dragging' : ''}`}
        style={sheetHeight != null ? { height: sheetHeight, maxHeight: 'none' } : undefined}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="mfc-sheet-drag-handle" onPointerDown={handleDragStart}>
          <div className="mfc-sheet-drag-pill" />
        </div>

        <div className="mfc-sheet-header">
          <div className="mfc-link-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search MFC exclusions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mfc-link-search-input"
            />
            <button className="mfc-link-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>

          <div className="mfc-link-toggle">
            <button
              className={`mfc-link-scope-btn ${!showAll ? 'active' : ''}`}
              onClick={() => setShowAll(false)}
            >
              Same Category
            </button>
            <button
              className={`mfc-link-scope-btn ${showAll ? 'active' : ''}`}
              onClick={() => setShowAll(true)}
            >
              All Categories
            </button>
          </div>
        </div>

        <div className="mfc-link-list">
          {filtered.length === 0 && (
            <div className="mfc-link-empty">No matching MFC exclusions</div>
          )}

          {grouped.map(([category, items]) => {
            const showHeader = showAll || grouped.length > 1
            const collapsible = showAll || grouped.length > 1
            const isOpen      = search.trim() || !collapsible || !collapsed.has(category)

            return (
              <div key={category} className="mfc-link-group">
                <div
                  className={`mfc-link-group-header ${!collapsible ? 'static' : ''}`}
                  onClick={collapsible ? () => setCollapsed(prev => {
                    const next = new Set(prev)
                    if (next.has(category)) next.delete(category)
                    else                    next.add(category)

                    return next
                  }) : undefined}
                >
                  <div className="mfc-link-group-label">
                    {collapsible && (
                      isOpen
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                    )}
                    {category}
                  </div>
                  <span className="mfc-link-group-count">{items.length}</span>
                </div>

                {isOpen && items.map(opt => (
                  <button
                    key={opt.Id}
                    className="mfc-link-option"
                    onClick={() => onSelect(opt.Id)}
                  >
                    <span className="mfc-link-option-text">{opt.Exclusion}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
