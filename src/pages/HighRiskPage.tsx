import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Layers } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import MatchTable from '../components/matches/MatchTable'
import { useApi } from '../hooks/useApi'
import { useCategories } from '../hooks/useCategories'
import { getSessions } from '../api/sessions'
import { getHighRisk } from '../api/matches'
import type { MatchRow, HighRiskMatchRaw } from '../types/match'

import '../styles/matches.css'
import '../styles/sessions.css'


type ViewMode = 'sessions' | 'all'


export default function HighRiskPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('sessions')
  const { categoryMap }         = useCategories()

  return (
    <>
      <Header title="High Risk Items">
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`filter-chip ${viewMode === 'sessions' ? 'active' : ''}`}
            data-risk="high"
            onClick={() => setViewMode('sessions')}
          >
            By Session
          </button>
          <button
            className={`filter-chip ${viewMode === 'all' ? 'active' : ''}`}
            data-risk="high"
            onClick={() => setViewMode('all')}
          >
            All Sessions
          </button>
        </div>
      </Header>

      <main className="page-content">
        {viewMode === 'sessions' && <SessionPicker />}
        {viewMode === 'all'      && <AllHighRisk categoryMap={categoryMap} />}
      </main>
    </>
  )
}


/* ── Session Picker ──────────────────────────────────────────────── */

function SessionPicker() {
  const navigate = useNavigate()

  const { data, loading, error } = useApi(
    () => getSessions(100, 0, 'Complete'),
    [],
  )

  const sessions = data?.sessions ?? []

  if (loading) return <LoadingSpinner message="Loading sessions..." />
  if (error)   return <EmptyState title="Error" message={error} />

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No completed sessions"
        message="Run an analysis first to review high-risk items."
      />
    )
  }

  return (
    <>
      <div className="page-header">
        <h2>Select a Session</h2>
      </div>

      <table className="session-grid">
        <thead>
          <tr>
            <th>ID</th>
            <th>Erector</th>
            <th>Job #</th>
            <th>Job Name</th>
            <th>Aligned</th>
            <th>Partial</th>
            <th>Erector Only</th>
            <th>MFC Only</th>
            <th>Risk Items</th>
            <th>High Risk</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(s => {
            const highRiskCount = s.total_high_risk ?? 0
            const riskCount     = (s.total_aligned ?? 0) + (s.total_partial ?? 0) + (s.total_erector_only ?? 0)

            return (
              <tr key={s.id} onClick={() => navigate(`/high-risk/session/${s.id}`)}>
                <td><span className="session-id">#{s.id}</span></td>
                <td>{s.erector_name_raw ?? '—'}</td>
                <td className="mono">{s.job_number ?? '—'}</td>
                <td className="truncate" style={{ maxWidth: '200px' }}>{s.job_name ?? '—'}</td>
                <td className="match-val aligned">{s.total_aligned ?? '—'}</td>
                <td className="match-val partial">{s.total_partial ?? '—'}</td>
                <td className="match-val erector-only">{s.total_erector_only ?? '—'}</td>
                <td className="match-val mfc-only">{s.total_mfc_only ?? '—'}</td>
                <td>
                  {riskCount > 0 ? (
                    <span className="risk-count-badge warn">
                      {riskCount}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {highRiskCount > 0 ? (
                    <span className="risk-count-badge high">
                      <AlertTriangle size={12} />
                      {highRiskCount}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}


/* ── All Sessions (flat) ─────────────────────────────────────────── */

function AllHighRisk({ categoryMap }: { categoryMap: Map<number, string> }) {
  const { data, loading, error } = useApi(() => getHighRisk(200), [])

  const rawMatches = data?.matches ?? []

  const matches: MatchRow[] = rawMatches.map((raw: HighRiskMatchRaw) => ({
    id:                     raw.Id,
    session_id:             raw.SessionId,
    extracted_exclusion_id: raw.ExtractedExclusionId,
    mfc_exclusion_id:       raw.MfcExclusionId,
    category_id:            raw.CategoryId,
    match_type:             raw.MatchType,
    confidence:             raw.Confidence,
    ai_reasoning:           raw.AiReasoning,
    risk_level:             raw.RiskLevel,
    risk_notes:             raw.RiskNotes,
    erector_text:           raw.ErectorExclusionText,
    mfc_text:               raw.MfcExclusionText,
    mfc_item_type:          raw.MfcItemType,
  }))

  const sessionMeta: Record<number, { erector?: string; job?: string; file?: string }> = {}
  for (const raw of rawMatches) {
    if (!sessionMeta[raw.SessionId]) {
      sessionMeta[raw.SessionId] = {
        erector: raw.ErectorNameRaw ?? undefined,
        job:     raw.JobNumber ?? undefined,
        file:    raw.SourceFileName ?? undefined,
      }
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>
          <Layers size={18} style={{ marginRight: 8, verticalAlign: -2 }} />
          All Sessions
        </h2>
      </div>

      {loading && <LoadingSpinner message="Loading high-risk matches..." />}
      {error && <EmptyState title="Error" message={error} />}

      {!loading && !error && matches.length === 0 && (
        <EmptyState
          title="No high-risk items"
          message="No matches flagged as High or Critical risk across any session."
        />
      )}

      {!loading && !error && matches.length > 0 && (
        <MatchTable
          matches={matches}
          showSession
          sessionMeta={sessionMeta}
          categoryMap={categoryMap}
        />
      )}
    </>
  )
}
