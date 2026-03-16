import { useState } from 'react'
import { ChevronDown, ChevronRight, Undo2, FileText, Tag } from 'lucide-react'


export interface RemovedItem {
  type:      'region' | 'paragraph'
  key:       string
  paraIndex: number
  mfcId?:    number
  snippet:   string
  matchType: string | null
}


interface Props {
  items:          RemovedItem[]
  onRestoreRegion:    (paraIndex: number, mfcId: number) => void
  onRestoreParagraph: (paraIndex: number) => void
}


export default function RemovedItemsPanel({ items, onRestoreRegion, onRestoreParagraph }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const regions    = items.filter(i => i.type === 'region')
  const paragraphs = items.filter(i => i.type === 'paragraph')

  return (
    <div className="removed-panel">
      <button className="removed-panel-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="removed-panel-toggle-left">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Removed Items
        </span>
        <span className="removed-panel-count">{items.length}</span>
      </button>

      {expanded && (
        <div className="removed-panel-body">
          {regions.length > 0 && (
            <div className="removed-panel-group">
              <div className="removed-panel-group-label">
                <Tag size={11} />
                Exclusion Regions ({regions.length})
              </div>
              {regions.map(item => (
                <div key={item.key} className="removed-panel-item">
                  <div className="removed-panel-item-text">
                    <span className={`removed-panel-match ${(item.matchType ?? 'unmatched').toLowerCase()}`}>
                      {item.matchType ?? 'Unmatched'}
                    </span>
                    <span className="removed-panel-snippet">{item.snippet}</span>
                  </div>
                  <button
                    className="removed-panel-restore"
                    onClick={() => onRestoreRegion(item.paraIndex, item.mfcId!)}
                    title="Restore this item"
                  >
                    <Undo2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {paragraphs.length > 0 && (
            <div className="removed-panel-group">
              <div className="removed-panel-group-label">
                <FileText size={11} />
                Paragraphs ({paragraphs.length})
              </div>
              {paragraphs.map(item => (
                <div key={item.key} className="removed-panel-item">
                  <div className="removed-panel-item-text">
                    <span className="removed-panel-snippet">{item.snippet}</span>
                  </div>
                  <button
                    className="removed-panel-restore"
                    onClick={() => onRestoreParagraph(item.paraIndex)}
                    title="Restore this paragraph"
                  >
                    <Undo2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
