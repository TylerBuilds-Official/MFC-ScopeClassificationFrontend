import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import SessionSummaryCard from '../components/sessions/SessionSummaryCard'
import ProgressCard from '../components/sessions/ProgressCard'
import ErectorAccordion from '../components/matches/ErectorAccordion'
import CategoryAccordion from '../components/matches/CategoryAccordion'
import MatchTable from '../components/matches/MatchTable'
import ActionItemsPanel from '../components/actions/ActionItemsPanel'
import { useApi } from '../hooks/useApi'
import { useCategories } from '../hooks/useCategories'
import { getSession, getSessionProgress } from '../api/sessions'
import { getSessionMatches } from '../api/matches'
import { getSessionActionItems } from '../api/actionItems'
import type { MatchRow } from '../types/match'
import type { SessionProgress } from '../types/session'

import '../styles/sessions.css'
import '../styles/matches.css'
import '../styles/progress.css'
import '../styles/action-items.css'


type ViewMode   = 'erector' | 'accordion' | 'table'
type SessionTab = 'matches' | 'action-items'

const MATCH_TYPES = ['Aligned', 'Partial', 'ErectorOnly', 'MfcOnly'] as const
const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low']              as const

const TERMINAL = new Set(['Complete', 'Error'])
const POLL_MS  = 3000


export default function SessionDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const sessionId = Number(id)

  const [activeTab, setActiveTab]         = useState<SessionTab>('matches')
  const [viewMode, setViewMode]           = useState<ViewMode>('erector')
  const [activeTypes, setActiveTypes]     = useState<Set<string>>(new Set())
  const [activeRisks, setActiveRisks]     = useState<Set<string>>(new Set())
  const [progress, setProgress]           = useState<SessionProgress | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { categoryMap } = useCategories()

  const session = useApi(
    () => getSession(sessionId),
    [sessionId],
  )

  const matches = useApi(
    () => getSessionMatches(sessionId),
    [sessionId],
  )

  const actionItems = useApi(
    () => getSessionActionItems(sessionId),
    [sessionId],
  )

  // Determine if this session is still running
  const sessionStatus = (session.data?.session as Record<string, unknown>)?.Status as string | undefined
  const isRunning     = sessionStatus != null && !TERMINAL.has(sessionStatus)

  // Poll progress while running
  useEffect(() => {
    if (!isRunning && !progress) return
    if (progress && TERMINAL.has(progress.status)) return

    async function poll() {
      try {
        const p = await getSessionProgress(sessionId)
        setProgress(p)

        if (TERMINAL.has(p.status)) {
          // Refetch full data now that it's done
          session.refetch()
          matches.refetch()
          actionItems.refetch()

          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch {
        // ignore transient errors
      }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [sessionId, isRunning])

  const matchRows = matches.data?.matches ?? []

  const filtered = useMemo(() => {
    let rows: MatchRow[] = matchRows

    if (activeTypes.size > 0) {
      rows = rows.filter(m => m.match_type != null && activeTypes.has(m.match_type))
    }

    if (activeRisks.size > 0) {
      rows = rows.filter(m => m.risk_level != null && activeRisks.has(m.risk_level))
    }

    return rows
  }, [matchRows, activeTypes, activeRisks])

  function toggleFilter(set: Set<string>, setFn: (s: Set<string>) => void, value: string) {
    const next = new Set(set)

    if (next.has(value)) next.delete(value)
    else                 next.add(value)

    setFn(next)
  }

  const hasFilters = activeTypes.size > 0 || activeRisks.size > 0

  // Action items: handle "View Match" → switch to matches tab
  const handleViewMatch = useCallback((_matchId: number) => {
    setActiveTab('matches')
  }, [])

  // Unreviewed count for tab badge
  const unreviewedCount = actionItems.data?.summary?.unreviewed ?? 0

  if (session.loading && !progress) return (
    <>
      <Header title="Session Detail" breadcrumb={['Sessions', `#${id}`]} />
      <main className="page-content"><LoadingSpinner message="Loading session..." /></main>
    </>
  )

  if (session.error || (!session.data && !progress)) return (
    <>
      <Header title="Session Detail" breadcrumb={['Sessions', `#${id}`]} />
      <main className="page-content">
        <EmptyState title="Session not found" message={session.error ?? 'No data returned.'} />
      </main>
    </>
  )

  const sess    = session.data?.session as Record<string, unknown> | undefined
  const summary = session.data?.match_summary

  const showProgress = progress && !TERMINAL.has(progress.status)
  const showResults  = sess && TERMINAL.has(String(sess.Status ?? ''))

  return (
    <>
      <Header title={`Session #${id}`} breadcrumb={['Sessions', `#${id}`]}>
        <button
          className="btn-analyze"
          style={{ padding: '6px 14px', fontSize: '12.5px' }}
          onClick={() => navigate('/sessions')}
        >
          ← Back
        </button>
      </Header>

      <main className="page-content">
        {/* Progress card while running */}
        {progress && <ProgressCard progress={progress} />}

        {/* Session summary + tabs once complete */}
        {showResults && sess && summary && (
          <>
            <SessionSummaryCard session={sess} matchSummary={summary} onUpdated={() => session.refetch()} />

            {/* Tab bar */}
            <div className="session-tab-bar">
              <button
                className={`session-tab ${activeTab === 'matches' ? 'active' : ''}`}
                onClick={() => setActiveTab('matches')}
              >
                Matches
              </button>
              <button
                className={`session-tab ${activeTab === 'action-items' ? 'active' : ''}`}
                onClick={() => setActiveTab('action-items')}
              >
                Action Items
                {unreviewedCount > 0 && (
                  <span className="session-tab-badge">{unreviewedCount}</span>
                )}
              </button>
            </div>

            {/* ── Matches Tab ──────────────────────────────────────── */}
            {activeTab === 'matches' && (
              <>
                <div className="page-header" style={{ marginTop: 16 }}>
                  <h2>Matches</h2>
                  <select
                    value={viewMode}
                    onChange={e => setViewMode(e.target.value as ViewMode)}
                    className="filter-select"
                  >
                    <option value="erector">By Erector Item</option>
                    <option value="accordion">By Category</option>
                    <option value="table">Flat Table</option>
                  </select>
                </div>

                {/* Filter chips */}
                <div className="filter-chip-bar">
                  <span className="filter-chip-label">Type</span>
                  {MATCH_TYPES.map(t => (
                    <button
                      key={t}
                      className={`filter-chip ${activeTypes.has(t) ? 'active' : ''}`}
                      data-type={t.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}
                      onClick={() => toggleFilter(activeTypes, setActiveTypes, t)}
                    >
                      {t.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}

                  <span className="filter-chip-divider" />

                  <span className="filter-chip-label">Risk</span>
                  {RISK_LEVELS.map(r => (
                    <button
                      key={r}
                      className={`filter-chip ${activeRisks.has(r) ? 'active' : ''}`}
                      data-risk={r.toLowerCase()}
                      onClick={() => toggleFilter(activeRisks, setActiveRisks, r)}
                    >
                      {r}
                    </button>
                  ))}

                  {hasFilters && (
                    <button
                      className="filter-chip clear"
                      onClick={() => { setActiveTypes(new Set()); setActiveRisks(new Set()) }}
                    >
                      Clear
                    </button>
                  )}

                  <span className="filter-chip-count">
                    {filtered.length} / {matchRows.length}
                  </span>
                </div>

                {matches.loading && <LoadingSpinner message="Loading matches..." />}

                {!matches.loading && filtered.length === 0 && (
                  <EmptyState
                    title={hasFilters ? 'No matches for filters' : 'No matches'}
                    message={hasFilters
                      ? 'Try adjusting your filters above.'
                      : 'No comparison data for this session yet.'}
                  />
                )}

                {!matches.loading && filtered.length > 0 && (
                  viewMode === 'erector'
                    ? <ErectorAccordion matches={filtered} categoryMap={categoryMap} />
                    : viewMode === 'accordion'
                      ? <CategoryAccordion matches={filtered} categoryMap={categoryMap} />
                      : <MatchTable matches={filtered} categoryMap={categoryMap} />
                )}
              </>
            )}

            {/* ── Action Items Tab ─────────────────────────────────── */}
            {activeTab === 'action-items' && (
              <div style={{ marginTop: 16 }}>
                <ActionItemsPanel
                  sessionId={sessionId}
                  onViewMatch={handleViewMatch}
                />
              </div>
            )}
          </>
        )}

        {/* Still loading initial data but not running */}
        {!showProgress && !showResults && !session.loading && (
          <EmptyState
            title="Waiting for data"
            message="Session data is not yet available."
          />
        )}
      </main>
    </>
  )
}
