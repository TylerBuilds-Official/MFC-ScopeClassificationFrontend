import { useState, useRef, useEffect } from 'react'
import { Download, Trash2, FileText, ListFilter, RotateCcw, MoreHorizontal, ChevronDown } from 'lucide-react'
import type { EditorViewMode, HighlightIntensity } from '../../types/editor'


const INTENSITY_LEVELS: HighlightIntensity[] = ['off', 'standard', 'bright']


export type EditorExportType = 'highlighted_unedited' | 'highlighted_edited' | 'clean_edited'

const EXPORT_LABELS: Record<EditorExportType, string> = {
  highlighted_unedited: 'Highlighted (Unedited)',
  highlighted_edited:   'Highlighted (Edited)',
  clean_edited:         'Clean (Edited)',
}

const EXPORT_TYPES: EditorExportType[] = ['highlighted_unedited', 'highlighted_edited', 'clean_edited']

const STORAGE_KEY = 'scope-editor-export-type'

function loadExportType(): EditorExportType {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored in EXPORT_LABELS) return stored as EditorExportType
  } catch { /* ignore */ }

  return 'highlighted_unedited'
}


interface Props {
  stats:              { total: number; aligned: number; partial: number; unmatched: number; removed: number }
  viewMode:           EditorViewMode
  highlightIntensity: HighlightIntensity
  onViewModeChange:       (mode: EditorViewMode) => void
  onHighlightIntensityChange: (level: HighlightIntensity) => void
  onRemoveAllUnmatched: () => void
  onExport:           (type: EditorExportType) => void
  onReset:            () => void
  exporting:          boolean
}


export default function EditorToolbar({
    stats, viewMode, highlightIntensity, onViewModeChange,
    onHighlightIntensityChange, onRemoveAllUnmatched,
    onExport, onReset, exporting }: Props) {

  const [menuOpen, setMenuOpen]           = useState(false)
  const [exportOpen, setExportOpen]       = useState(false)
  const [exportType, setExportType]       = useState<EditorExportType>(loadExportType)
  const menuRef   = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  function selectExportType(type: EditorExportType) {
    setExportType(type)
    setExportOpen(false)
    try { localStorage.setItem(STORAGE_KEY, type) } catch { /* ignore */ }
    onExport(type)
  }

  // Close menus on outside click
  useEffect(() => {
    if (!menuOpen && !exportOpen) return

    function handleClick(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (exportOpen && exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen, exportOpen])

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

        <div className="editor-split-btn" ref={exportRef}>
          <button
            className="editor-split-main"
            onClick={() => onExport(exportType)}
            disabled={exporting}
          >
            <Download size={13} />
            {exporting ? 'Exporting...' : EXPORT_LABELS[exportType]}
          </button>
          <button
            className={`editor-split-chevron ${exportOpen ? 'active' : ''}`}
            onClick={() => setExportOpen(!exportOpen)}
            disabled={exporting}
          >
            <ChevronDown size={12} />
          </button>

          {exportOpen && (
            <div className="editor-overflow-menu">
              {EXPORT_TYPES.map(type => (
                <button
                  key={type}
                  className={`editor-overflow-item ${type === exportType ? 'selected' : ''}`}
                  onClick={() => selectExportType(type)}
                >
                  {EXPORT_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>

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
