import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react'

import RiskBadge from '../global/RiskBadge'
import type { MatchRow } from '../../types/match'


interface ErectorAccordionProps {
  matches:      MatchRow[]
  categoryMap?: Map<number, string>
}


interface ErectorGroup {
  extractedId:  number | null
  erectorText:  string
  matches:      MatchRow[]
  bestRisk:     string | null
  bestType:     string | null
  multiMatch:   boolean
}


const RISK_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }


export default function ErectorAccordion({ matches, categoryMap }: ErectorAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<number | null>>(new Set())

  const groups = useMemo(() => buildGroups(matches), [matches])

  function toggle(id: number | null) {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)

      return next
    })
  }

  return (
    <div className="erector-accordion">
      {groups.map(g => {
        const isOpen = openIds.has(g.extractedId)

        return (
          <div key={g.extractedId ?? 'null'} className={`erector-group ${isOpen ? 'expanded' : ''}`}>
            {/* Header — erector text + summary badges */}
            <div
              className="erector-group-header"
              onClick={() => toggle(g.extractedId)}
            >
              <div className="erector-toggle">
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>

              <div className="erector-header-text">
                <p className="erector-excerpt">{g.erectorText}</p>
              </div>

              <div className="erector-header-badges">
                {g.multiMatch && (
                  <span className="multi-match-badge" title={`Matches to ${g.matches.length} MFC exclusions`}>
                    <Link2 size={12} />
                    {g.matches.length}
                  </span>
                )}
                {g.bestType && (
                  <span className={`match-type-pill ${matchTypeClass(g.bestType)}`}>
                    {formatMatchType(g.bestType)}
                  </span>
                )}
                <RiskBadge level={g.bestRisk} />
              </div>
            </div>

            {/* Body — MFC match cards */}
            {isOpen && (
              <div className="erector-group-body">
                {g.matches.map((m, i) => (
                  <MfcMatchCard
                    key={m.id}
                    match={m}
                    index={i + 1}
                    total={g.matches.length}
                    categoryMap={categoryMap}
                    showMultiLabel={g.multiMatch}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


/* ── MFC Match Card (inside an erector group) ────────────────────── */

interface MfcMatchCardProps {
  match:          MatchRow
  index:          number
  total:          number
  categoryMap?:   Map<number, string>
  showMultiLabel: boolean
}

function MfcMatchCard({ match: m, index, total, categoryMap, showMultiLabel }: MfcMatchCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="mfc-match-card">
      {/* MFC header row */}
      <div className="mfc-match-header">
        {showMultiLabel && (
          <span className="mfc-match-index">{index} of {total}</span>
        )}
        <span className={`match-type-pill ${matchTypeClass(m.match_type)}`}>
          {formatMatchType(m.match_type)}
        </span>
        <ConfidenceBar value={m.confidence} />
        <RiskBadge level={m.risk_level} />
        {m.category_id != null && categoryMap && (
          <span className="match-card-category">
            {categoryMap.get(m.category_id) ?? `Category ${m.category_id}`}
          </span>
        )}
      </div>

      {/* MFC exclusion text */}
      {m.mfc_text && (
        <div className="excl-text-block mfc">
          <div className="excl-text-label">
            MFC
            {m.mfc_item_type && m.mfc_item_type !== 'Exclusion' && (
              <span className={`excl-type-badge ${m.mfc_item_type.toLowerCase()}`}>
                {m.mfc_item_type}
              </span>
            )}
          </div>
          <p className="excl-text-content">{m.mfc_text}</p>
        </div>
      )}

      {!m.mfc_text && m.match_type === 'ErectorOnly' && (
        <div className="excl-text-block empty">
          <p className="excl-text-content" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No matching MFC exclusion found.
          </p>
        </div>
      )}

      {/* AI reasoning toggle */}
      {(m.ai_reasoning || m.risk_notes) && (
        <>
          <button
            className="reasoning-toggle"
            onClick={() => setShowReasoning(!showReasoning)}
          >
            {showReasoning ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            AI Analysis
          </button>

          {showReasoning && (
            <div className="mfc-match-reasoning">
              {m.ai_reasoning && (
                <div className="detail-section">
                  <span className="detail-label">AI Reasoning</span>
                  <p className="detail-text">{m.ai_reasoning}</p>
                </div>
              )}
              {m.risk_notes && (
                <div className="detail-section">
                  <span className="detail-label">Risk Notes</span>
                  <p className="detail-text risk">{m.risk_notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}


/* ── Grouping logic ──────────────────────────────────────────────── */

function buildGroups(matches: MatchRow[]): ErectorGroup[] {
  const map = new Map<number | null, MatchRow[]>()

  for (const m of matches) {
    const key = m.extracted_exclusion_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }

  return Array.from(map.entries())
    .map(([id, rows]) => {
      // Sort within group: highest confidence first
      rows.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))

      // Best risk = most severe across all matches in group
      const bestRisk = rows.reduce<string | null>((best, r) => {
        if (!r.risk_level) return best
        if (!best) return r.risk_level

        return (RISK_ORDER[r.risk_level] ?? 99) < (RISK_ORDER[best] ?? 99) ? r.risk_level : best
      }, null)

      // Best match type = first by confidence
      const bestType = rows[0]?.match_type ?? null

      return {
        extractedId: id,
        erectorText: rows[0]?.erector_text ?? `Erector Item #${id ?? '—'}`,
        matches:     rows,
        bestRisk,
        bestType,
        multiMatch:  rows.length > 1,
      }
    })
    .sort((a, b) => {
      // Sort groups: multi-match first, then by risk severity
      if (a.multiMatch !== b.multiMatch) return a.multiMatch ? -1 : 1

      const ra = RISK_ORDER[a.bestRisk ?? ''] ?? 99
      const rb = RISK_ORDER[b.bestRisk ?? ''] ?? 99

      return ra - rb
    })
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
