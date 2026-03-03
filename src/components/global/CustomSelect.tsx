import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import '../../styles/custom-select.css'


interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options:      SelectOption[]
  value:        string
  onChange:     (value: string) => void
  placeholder?: string
  className?:   string
}


export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className   = '',
}: CustomSelectProps) {
  const [open, setOpen]         = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)
  const listRef                 = useRef<HTMLUListElement>(null)
  const [focusIdx, setFocusIdx] = useState(-1)

  const selected = options.find(o => o.value === value)

  /* ── Close on outside click ─────────────────────────────────────── */

  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  /* ── Scroll focused option into view ────────────────────────────── */

  useEffect(() => {
    if (!open || focusIdx < 0 || !listRef.current) return

    const item = listRef.current.children[focusIdx] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [focusIdx, open])

  /* ── Keyboard navigation ────────────────────────────────────────── */

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setOpen(true)
      setFocusIdx(selected ? options.findIndex(o => o.value === value) : 0)

      return
    }

    if (!open) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusIdx(prev => Math.min(prev + 1, options.length - 1))
        break

      case 'ArrowUp':
        e.preventDefault()
        setFocusIdx(prev => Math.max(prev - 1, 0))
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusIdx >= 0 && focusIdx < options.length) {
          onChange(options[focusIdx].value)
          setOpen(false)
        }
        break

      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  /* ── Select handler ─────────────────────────────────────────────── */

  function handleSelect(option: SelectOption) {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={`custom-select ${open ? 'open' : ''} ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className={`custom-select-value ${!selected ? 'placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`custom-select-chevron ${open ? 'rotated' : ''}`} />
      </button>

      {open && (
        <ul ref={listRef} className="custom-select-dropdown">
          {options.map((option, idx) => (
            <li
              key={option.value}
              className={[
                'custom-select-option',
                option.value === value ? 'selected' : '',
                idx === focusIdx       ? 'focused'  : '',
              ].join(' ')}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusIdx(idx)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
