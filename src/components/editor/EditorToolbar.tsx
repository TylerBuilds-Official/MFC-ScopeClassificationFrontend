import { Download, Trash2, Eye, EyeOff } from 'lucide-react'


interface Props {
  stats:              { total: number; aligned: number; partial: number; unmatched: number; removed: number }
  showUnmatched:      boolean
  onToggleUnmatched:  () => void
  onRemoveAllUnmatched: () => void
  onExport:           () => void
  exporting:          boolean
}


export default function EditorToolbar({
    stats, showUnmatched, onToggleUnmatched,
    onRemoveAllUnmatched, onExport, exporting }: Props) {

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-stats">
        <span className="editor-stat aligned">{stats.aligned} Aligned</span>
        <span className="editor-stat partial">{stats.partial} Partial</span>
        <span className="editor-stat unmatched">{stats.unmatched} Unmatched</span>
        {stats.removed > 0 && (
          <span className="editor-stat removed">{stats.removed} Removed</span>
        )}
      </div>

      <div className="editor-toolbar-actions">
        <button className="editor-tool-btn" onClick={onToggleUnmatched} title={showUnmatched ? 'Hide unmatched regions' : 'Show unmatched regions'}>
          {showUnmatched ? <EyeOff size={13} /> : <Eye size={13} />}
          {showUnmatched ? 'Hide' : 'Show'} Unmatched
        </button>

        <button className="editor-tool-btn danger" onClick={onRemoveAllUnmatched} title="Remove all paragraphs with no matches">
          <Trash2 size={13} />
          Remove Unmatched
        </button>

        <button className="editor-tool-btn primary" onClick={onExport} disabled={exporting}>
          <Download size={13} />
          {exporting ? 'Exporting...' : 'Export .docx'}
        </button>
      </div>
    </div>
  )
}
