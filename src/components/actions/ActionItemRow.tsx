import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Plus,
  X,
  RotateCcw,
  Check,
  MessageSquare,
} from 'lucide-react'

import RiskBadge from '../global/RiskBadge'
import MfcIdLink from '../global/MfcIdLink'
import AiText from '../global/AiText'
import StatusContextMenu from './StatusContextMenu'
import type { ActionItem } from '../../types/actionItem'


interface ActionItemRowProps {
  item:         ActionItem
  categoryMap:  Map<number, string>
  showRisk?:    boolean
  onStatus:     (id: number, status: string) => void
  onNotes:      (id: number, notes: string) => void
  onViewMatch:  (matchId: number) => void
  onAddToMfc:   (item: ActionItem) => void
}


const STATUS_CYCLE: Record<string, string> = {
  unreviewed:   'acknowledged',
  acknowledged: 'addressed',
  addressed:    'addressed',
}

const STATUS_LABELS: Record<string, string> = {
  unreviewed:   'Unreviewed',
  acknowledged: 'Acknowledged',
  addressed:    'Addressed',
  dismissed:    'Dismissed',
}


export default function ActionItemRow({
  item,
  categoryMap,
  showRisk = true,
  onStatus,
  onNotes,
  onViewMatch,
  onAddToMfc,
}: ActionItemRowProps) {
  const [expanded, setExpanded]       = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText]       = useState(item.notes ?? '')

  const isDismissed = item.status === 'dismissed'
  const category    = item.category_id != null ? categoryMap.get(item.category_id) : null

  function handleAdvanceStatus() {
    const next = STATUS_CYCLE[item.status]
    if (next) onStatus(item.id, next)
  }

  function handleDismiss() {
    onStatus(item.id, 'dismissed')
  }

  function handleRestore() {
    onStatus(item.id, 'unreviewed')
  }

  function handleNoteSave() {
    onNotes(item.id, noteText)
    setEditingNote(false)
  }

  function handleNoteKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNoteSave()
    }
    if (e.key === 'Escape') {
      setNoteText(item.notes ?? '')
      setEditingNote(false)
    }
  }

  const pct = item.confidence != null ? Math.round(item.confidence * 100) : null
  const confColor =
    pct == null       ? undefined :
    pct >= 85         ? 'var(--match-aligned)' :
    pct >= 60         ? 'var(--match-partial)' :
                        'var(--match-erector-only)'

  return (
    <StatusContextMenu
      currentStatus={item.status}
      onSelect={status => onStatus(item.id, status)}
    >
    <div className={`action-item-row ${isDismissed ? 'dismissed' : ''} status-${item.status}`}>
      {/* Main row */}
      <div className="action-item-main">
        {/* Expand toggle */}
        <button
          className="action-item-toggle"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Erector text */}
        <div className="action-item-text" onClick={() => setExpanded(!expanded)}>
          <p className="action-item-excerpt">{item.erector_text ?? '—'}</p>
          {category && (
            <span className="action-item-category">{category}</span>
          )}
        </div>

        {/* Badges */}
        <div className="action-item-badges">
          {item.match_type && (
            <span className={`match-type-pill ${matchTypeClass(item.match_type)}`}>
              {formatMatchType(item.match_type)}
            </span>
          )}
          {pct != null && (
            <div className="confidence-bar">
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: confColor }} />
              </div>
              <span className="bar-label">{pct}%</span>
            </div>
          )}
          {showRisk && <RiskBadge level={item.risk_level} />}
        </div>

        {/* Actions */}
        <div className="action-item-actions">
          {!isDismissed && (
            <>
              <button
                className={`action-status-btn ${item.status}`}
                onClick={handleAdvanceStatus}
                title={`Mark as ${STATUS_LABELS[STATUS_CYCLE[item.status] ?? '']}`}
              >
                <Check size={13} />
                <span>{STATUS_LABELS[item.status]}</span>
              </button>

              <button
                className="action-icon-btn dismiss"
                onClick={handleDismiss}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          )}

          {isDismissed && (
            <button
              className="action-icon-btn restore"
              onClick={handleRestore}
              title="Restore"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="action-item-detail">
          {/* Side-by-side text for partial matches */}
          {item.section === 'partial_review' && item.mfc_text && (
            <div className="action-compare-row">
              <div className="excl-text-block erector">
                <div className="excl-text-label">Erector</div>
                <p className="excl-text-content">{item.erector_text}</p>
              </div>
              <div className="excl-text-block mfc">
                <div className="excl-text-label">
                  MFC
                  <MfcIdLink id={item.mfc_exclusion_id} />
                </div>
                <p className="excl-text-content">{item.mfc_text}</p>
              </div>
            </div>
          )}

          {/* MFC text for high_risk non-erector-only */}
          {item.section === 'high_risk' && item.mfc_text && (
            <div className="excl-text-block mfc">
              <div className="excl-text-label">
                MFC Match
                <MfcIdLink id={item.mfc_exclusion_id} />
                {item.mfc_item_type && item.mfc_item_type !== 'Exclusion' && (
                  <span className={`excl-type-badge ${item.mfc_item_type.toLowerCase()}`}>
                    {item.mfc_item_type}
                  </span>
                )}
              </div>
              <p className="excl-text-content">{item.mfc_text}</p>
            </div>
          )}

          {/* AI reasoning + risk notes */}
          {item.ai_reasoning && (
            <div className="detail-section">
              <span className="detail-label">AI Reasoning</span>
              <p className="detail-text"><AiText text={item.ai_reasoning} /></p>
            </div>
          )}
          {showRisk && item.risk_notes && (
            <div className="detail-section">
              <span className="detail-label">Risk Notes</span>
              <p className="detail-text risk"><AiText text={item.risk_notes} /></p>
            </div>
          )}

          {/* Notes */}
          <div className="action-notes-row">
            <MessageSquare size={13} className="action-notes-icon" />
            {editingNote ? (
              <div className="inline-edit-row" style={{ flex: 1 }}>
                <input
                  className="inline-edit-input"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={handleNoteKeyDown}
                  onBlur={handleNoteSave}
                  placeholder="Add a note..."
                  autoFocus
                />
              </div>
            ) : (
              <button
                className="action-notes-trigger"
                onClick={() => setEditingNote(true)}
              >
                {item.notes || 'Add a note...'}
              </button>
            )}
          </div>

          {/* Footer actions */}
          <div className="action-item-footer">
            {item.match_id != null && (
              <button
                className="action-link-btn"
                onClick={() => onViewMatch(item.match_id!)}
              >
                <Eye size={13} />
                View Match
              </button>
            )}

            {item.section === 'erector_only' && (
              <button
                className="action-link-btn add-mfc"
                onClick={() => onAddToMfc(item)}
              >
                <Plus size={13} />
                Add to MFC Exclusions
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    </StatusContextMenu>
  )
}


/* ── Helpers ─────────────────────────────────────────────────────── */

function matchTypeClass(type: string | null): string {
  if (!type) return ''

  return type.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

function formatMatchType(type: string | null): string {
  if (!type) return '—'

  return type.replace(/([A-Z])/g, ' $1').trim()
}
