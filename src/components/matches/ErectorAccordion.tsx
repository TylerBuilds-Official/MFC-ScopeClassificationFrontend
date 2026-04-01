import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react'

import RiskBadge from '../global/RiskBadge'
import MfcIdLink from '../global/MfcIdLink'
import AiText from '../global/AiText'
import type { MatchRow } from '../../types/match'


interface ErectorAccordionProps {
  matches:           MatchRow[]
  categoryMap?:      Map<number, string>
  showRisk?:         boolean
  erectorName?:      string | null
  highlightMatchId?: number | null
  onHighlightDone?:  () => void
}


interface ErectorGroup {
  extractedId:  number | null
  erectorText:  string
  matches:      MatchRow[]
  bestRisk:     string | null
  bestType:     string | null
  multiMatch:   boolean
  isMfcOnly:    boolean
}


const RISK_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }


export default function ErectorAccordion({ matches, categoryMap, showRisk = true, erectorName, highlightMatchId, onHighlightDone }: ErectorAccordionProps) {
  const [openIds, setOpenIds]           = useState<Set<number | null>>(new Set())
  const [hoveredAtomic, setHoveredAtomic] = useState<{ groupId: number | null; phrase: string } | null>(null)

  const groups = useMemo(() => buildGroups(matches), [matches])

  /* ── Auto-open group + scroll to highlighted match ────────────── */

  useEffect(() => {
    if (highlightMatchId == null) return

    const ownerGroup = groups.find(g => g.matches.some(m => m.id === highlightMatchId))
    if (ownerGroup) {
      setOpenIds(prev => new Set(prev).add(ownerGroup.extractedId))
    }

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
    }, 200)

    return () => clearTimeout(timer)
  }, [highlightMatchId]) // eslint-disable-line react-hooks/exhaustive-deps

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
                <p className="erector-excerpt">
                  {erectorName && !g.isMfcOnly && <span className="erector-name-prefix">{erectorName}:</span>}
                  <HighlightedExcerpt
                    text={g.erectorText}
                    highlight={hoveredAtomic?.groupId === g.extractedId ? hoveredAtomic.phrase : null}
                  />
                </p>
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
                {showRisk && <RiskBadge level={g.bestRisk} />}
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
                    showRisk={showRisk}
                    onAtomicHover={phrase => setHoveredAtomic(phrase ? { groupId: g.extractedId, phrase } : null)}
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
  showRisk?:      boolean
  onAtomicHover?: (phrase: string | null) => void
}

function MfcMatchCard({ match: m, index, total, categoryMap, showMultiLabel, showRisk = true, onAtomicHover }: MfcMatchCardProps) {
  const [showReasoning, setShowReasoning] = useState(false)

  return (
    <div className="mfc-match-card" data-match-id={m.id}>
      {/* MFC header row */}
      <div className="mfc-match-header">
        {showMultiLabel && (
          <span className="mfc-match-index">{index} of {total}</span>
        )}
        <span className={`match-type-pill ${matchTypeClass(m.match_type)}`}>
          {formatMatchType(m.match_type)}
        </span>
        <ConfidenceBar value={m.confidence} />
        {showRisk && <RiskBadge level={m.risk_level} />}
        {m.category_id != null && categoryMap && (
          <span className="match-card-category">
            {categoryMap.get(m.category_id) ?? `Category ${m.category_id}`}
          </span>
        )}
      </div>

      {/* Atomic match phrase — shows which erector fragment triggered the deterministic match */}
      {m.match_type === 'Deterministic' && m.atomic_text && (
        <div
          className="atomic-match-label"
          onMouseEnter={() => onAtomicHover?.(m.atomic_text)}
          onMouseLeave={() => onAtomicHover?.(null)}
        >
          <span className="atomic-match-prefix">matched</span>
          <span className="atomic-match-phrase">"{m.atomic_text}"</span>
        </div>
      )}

      {/* MFC exclusion text */}
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
                  <p className="detail-text"><AiText text={m.ai_reasoning} /></p>
                </div>
              )}
              {showRisk && m.risk_notes && (
                <div className="detail-section">
                  <span className="detail-label">Risk Notes</span>
                  <p className="detail-text risk"><AiText text={m.risk_notes} /></p>
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
      // If a Deterministic match exists, drop ErectorOnly rows and low-confidence
      // AI matches that add noise alongside high-confidence auto-matches
      const hasDeterministic = rows.some(r => r.match_type === 'Deterministic')
      if (hasDeterministic) {
        rows = rows.filter(r => {
          if (r.match_type === 'ErectorOnly') return false
          if (r.match_type !== 'Deterministic' && (r.confidence ?? 0) < 0.80) return false

          return true
        })
      }

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

      const isMfcOnly = id == null

      return {
        extractedId: id,
        erectorText: isMfcOnly
          ? 'Unaddressed — MFC template items not found in erector scope letter'
          : (rows[0]?.erector_text ?? `Erector Item #${id}`),
        matches:     rows,
        bestRisk,
        bestType,
        multiMatch:  rows.length > 1,
        isMfcOnly,
      }
    })
    .sort((a, b) => {
      // MfcOnly group always at the bottom
      if (a.isMfcOnly !== b.isMfcOnly) return a.isMfcOnly ? 1 : -1

      // Multi-match first, then by risk severity
      if (a.multiMatch !== b.multiMatch) return a.multiMatch ? -1 : 1

      const ra = RISK_ORDER[a.bestRisk ?? ''] ?? 99
      const rb = RISK_ORDER[b.bestRisk ?? ''] ?? 99

      return ra - rb
    })
}


/* ── Helpers ─────────────────────────────────────────────────────── */

/* ── Highlighted Excerpt (atomic hover) ───────────────────────── */

function HighlightedExcerpt({ text, highlight }: { text: string; highlight: string | null }) {
  if (!highlight) return <>{text}</>

  const idx = text.toLowerCase().indexOf(highlight.toLowerCase())
  if (idx === -1) return <>{text}</>

  const before  = text.slice(0, idx)
  const matched = text.slice(idx, idx + highlight.length)
  const after   = text.slice(idx + highlight.length)

  return (
    <>
      {before}
      <span className="atomic-excerpt-highlight">{matched}</span>
      {after}
    </>
  )
}


function matchTypeClass(type: string | null): string {
  if (!type) return ''

  return type.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

function formatMatchType(type: string | null): string {
  if (!type) return '—'
  if (type === 'Deterministic') return 'Auto-Matched'

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
