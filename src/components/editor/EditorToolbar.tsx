import { useState, useRef, useEffect } from 'react'
import { Download, Trash2, FileText, ListFilter, RotateCcw, MoreHorizontal } from 'lucide-react'
import type { EditorViewMode, HighlightIntensity } from '../../types/editor'


const INTENSITY_LEVELS: HighlightIntensity[] = ['dim', 'standard', 'bright']


interface Props {
  stats:              { total: number; aligned: number; partial: number; unmatched: number; removed: number }
  viewMode:           EditorViewMode
  highlightIntensity: HighlightIntensity
  onViewModeChange:       (mode: EditorViewMode) => void
  onHighlightIntensityChange: (level: HighlightIntensity) => void
  onRemoveAllUnmatched: () => void
  onExport:           () => void
  onReset:            () => void
  exporting:          boolean
}


export default function EditorToolbar({
    stats, viewMode, highlightIntensity, onViewModeChange,
    onHighlightIntensityChange, onRemoveAllUnmatched,
    onExport, onReset, exporting }: Props) {

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-left">
        <div className="editor-view-toggle">
          <button
            className={`editor-view-btn ${viewMode === 'erector_exclusions' ? 'active' : ''}`}
            onClick={() => onViewModeChange('erector_exclusions')}
            title="Show only erector exclusions"
          >
            <ListFilter size={13} />
            Erector Exclusions
          </button>
          <button
            className={`editor-view-btn ${viewMode === 'full' ? 'active' : ''}`}
            onClick={() => onViewModeChange('full')}
            title="Show full template"
          >
            <FileText size={13} />
            Full Template
          </button>
        </div>

        <div className="editor-toolbar-stats">
          <span className="editor-stat aligned">{stats.aligned} Aligned</span>
          <span className="editor-stat partial">{stats.partial} Partial</span>
          <span className="editor-stat unmatched">{stats.unmatched} Unmatched</span>
          {stats.removed > 0 && (
            <span className="editor-stat removed">{stats.removed} Removed</span>
          )}
        </div>
      </div>

      <div className="editor-toolbar-actions">
        <div className="editor-intensity">
          <span className="editor-intensity-label">Highlight</span>
          <div className="editor-intensity-steps">
            {INTENSITY_LEVELS.map(level => (
              <button
                key={level}
                className={`editor-intensity-step ${level} ${highlightIntensity === level ? 'active' : ''}`}
                onClick={() => onHighlightIntensityChange(level)}
                title={`${level.charAt(0).toUpperCase() + level.slice(1)} highlights`}
              />
            ))}
          </div>
        </div>

        <span className="editor-toolbar-sep" />

        <button className="editor-tool-btn primary" onClick={onExport} disabled={exporting}>
          <Download size={13} />
          {exporting ? 'Exporting...' : 'Export .docx'}
        </button>

        <div className="editor-overflow" ref={menuRef}>
          <button
            className={`editor-tool-btn ${menuOpen ? 'active-menu' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            title="More actions"
          >
            <MoreHorizontal size={15} />
          </button>

          {menuOpen && (
            <div className="editor-overflow-menu">
              <button
                className="editor-overflow-item danger"
                onClick={() => { onRemoveAllUnmatched(); setMenuOpen(false) }}
              >
                <Trash2 size={13} />
                Remove All Unmatched
              </button>
              <button
                className="editor-overflow-item danger"
                onClick={() => { onReset(); setMenuOpen(false) }}
              >
                <RotateCcw size={13} />
                Reset All Edits
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
