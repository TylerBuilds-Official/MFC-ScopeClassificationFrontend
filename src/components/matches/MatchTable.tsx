import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Circle, Loader2 } from 'lucide-react'

import RiskBadge from '../../components/global/RiskBadge'
import MfcIdLink from '../../components/global/MfcIdLink'
import AiText from '../../components/global/AiText'
import type { MatchRow } from '../../types/match'
import type { ActionItem } from '../../types/actionItem'


interface MatchTableProps {
  matches:              MatchRow[]
  showSession?:         boolean
  showCategory?:        boolean
  sessionMeta?:         Record<number, { erector?: string; job?: string; file?: string }>
  categoryMap?:         Map<number, string>
  highlightMatchId?:    number | null
  onHighlightDone?:     () => void
  actionByMatchId?:     Map<number, ActionItem>
  busyActionIds?:       Set<number>
  onToggleAddressed?:   (matchId: number) => void
}


export default function MatchTable({ matches, showSession, showCategory = true, sessionMeta, categoryMap, highlightMatchId, onHighlightDone, actionByMatchId, busyActionIds, onToggleAddressed }: MatchTableProps) {
  const hasTriage = actionByMatchId != null && onToggleAddressed != null
  const [expandedId, setExpandedId] = useState<number | null>(null)

  /* ── Auto-expand + scroll to highlighted match ────────────────── */

  useEffect(() => {
    if (highlightMatchId == null) return

    setExpandedId(highlightMatchId)

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-match-id="${highlightMatchId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('deep-link-highlight')
        el.addEventListener('animationend', () => {
          el.classList.remove('deep-link-highlight')
          onHighlightDone?.()
        }, { once: true })
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [highlightMatchId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="match-list">
      {matches.map(m => {
        const isOpen = expandedId === m.id

        return (
          <div
            key={m.id}
            className={`match-card ${isOpen ? 'expanded' : ''}`}
            data-match-id={m.id}
          >
            {/* Header row — click to expand */}
            <div
              className="match-card-header"
              onClick={() => setExpandedId(isOpen ? null : m.id)}
            >
              <div className="match-card-toggle">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>

              <span className={`match-type-pill ${matchTypeClass(m.match_type)}`}>
                {formatMatchType(m.match_type)}
              </span>

              <ConfidenceBar value={m.confidence} />
              <RiskBadge level={m.risk_level} />

              {showCategory && (
                <span className="match-card-category">
                  {m.category_id != null
                    ? (categoryMap?.get(m.category_id) ?? `Category ${m.category_id}`)
                    : ''}
                </span>
              )}

              {showSession && sessionMeta?.[m.session_id] && (
                <span className="match-card-session">
                  #{m.session_id} — {sessionMeta[m.session_id].erector}
                </span>
              )}

              {hasTriage && (() => {
                const action = actionByMatchId.get(m.id)
                if (!action) return null

                const isBusy      = busyActionIds?.has(action.id) ?? false
                const isAddressed = action.status === 'addressed'

                return (
                  <button
                    className={`triage-btn ${isAddressed ? 'addressed' : ''}`}
                    title={isAddressed ? 'Mark unreviewed' : 'Mark addressed'}
                    disabled={isBusy}
                    onClick={e => { e.stopPropagation(); onToggleAddressed(m.id) }}
                  >
                    {isBusy
                      ? <Loader2 size={14} className="triage-spinner" />
                      : isAddressed
                        ? <CheckCircle size={14} />
                        : <Circle size={14} />
                    }
                    <span className="triage-label">
                      {isAddressed ? 'Addressed' : 'Mark Done'}
                    </span>
                  </button>
                )
              })()}
            </div>

            {/* Expanded — exclusion text + AI reasoning + risk notes */}
            {isOpen && (
              <div className="match-card-detail">
                <div className="match-card-body">
                  {m.erector_text && (
                    <div className="excl-text-block erector">
                      <span className="excl-text-label">Erector</span>
                      <p className="excl-text-content">{m.erector_text}</p>
                    </div>
                  )}

                  {m.mfc_text && (
                    <div className="excl-text-block mfc">
                      <div className="excl-text-label">
                        MFC
                        <MfcIdLink id={m.mfc_exclusion_id} />
                        {m.mfc_item_type && m.mfc_item_type !== 'Exclusion' && (
                          <span className={`excl-type-badge ${m.mfc_item_type.toLowerCase()}`}>
                            {m.mfc_item_type}
                          </span>
                        )}
                      </div>
                      <p className="excl-text-content">{m.mfc_text}</p>
                    </div>
                  )}

                  {!m.erector_text && !m.mfc_text && (
                    <div className="excl-text-block empty">
                      <p className="excl-text-content" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Exclusion text not available.
                      </p>
                    </div>
                  )}
                </div>

                {m.ai_reasoning && (
                  <div className="detail-section">
                    <span className="detail-label">AI Reasoning</span>
                    <p className="detail-text"><AiText text={m.ai_reasoning} /></p>
                  </div>
                )}
                {m.risk_notes && (
                  <div className="detail-section">
                    <span className="detail-label">Risk Notes</span>
                    <p className="detail-text risk"><AiText text={m.risk_notes} /></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


function matchTypeClass(type: string | null): string {
  if (!type) return ''

  return type.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}


function formatMatchType(type: string | null): string {
  if (!type) return '—'

  return type.replace(/([A-Z])/g, ' $1').trim()
}


function ConfidenceBar({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>

  const pct   = Math.round(value * 100)
  const color =
    pct >= 85 ? 'var(--match-aligned)' :
    pct >= 60 ? 'var(--match-partial)' :
                'var(--match-erector-only)'

  return (
    <div className="confidence-bar">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-label">{pct}%</span>
    </div>
  )
}
