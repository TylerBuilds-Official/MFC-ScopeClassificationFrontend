import { useState, useMemo, useEffect, useRef, useCallback }  from 'react'
import { Download, ChevronDown, FilePenLine }                 from 'lucide-react'
import { useParams, useNavigate }                             from 'react-router-dom'

import Header                               from '../components/global/Header'
import LoadingSpinner                       from '../components/global/LoadingSpinner'
import EmptyState                           from '../components/global/EmptyState'
import CustomSelect                         from '../components/global/CustomSelect'
import SessionSummaryCard                   from '../components/sessions/SessionSummaryCard'
import ProgressCard                         from '../components/sessions/ProgressCard'
import ErectorAccordion                     from '../components/matches/ErectorAccordion'
import CategoryAccordion                    from '../components/matches/CategoryAccordion'
import MatchTable                           from '../components/matches/MatchTable'
import ActionItemsPanel                     from '../components/actions/ActionItemsPanel'
import { useApi }                           from '../hooks/useApi'
import { useCategories }                    from '../hooks/useCategories'
import { downloadScopeLetter }              from '../api/export'
import { getSession, getSessionProgress }   from '../api/sessions'
import { getSessionMatches }                from '../api/matches'
import { getSessionActionItems }            from '../api/actionItems'
import type { MatchRow }                    from '../types/match'
import type { SessionProgress }             from '../types/session'

import '../styles/sessions.css'
import '../styles/matches.css'
import '../styles/progress.css'
import '../styles/action-items.css'


/* ── Match Legend ───────────────────────────────────────────────── */

function MatchLegend({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'table') return null

  return (
    <div className="match-legend">
      <span className="match-legend-item">LINKS</span>
      <span className="match-legend-divider" />
      <span className="match-legend-item">ALIGNMENT</span>
      <span className="match-legend-divider" />
      <span className="match-legend-item">RISK</span>
    </div>
  )
}

/* ── Export Button (split dropdown) ─────────────────────────────── */

function ExportButton({ sessionId }: { sessionId: number }) {
  const navigate          = useNavigate()
  const [busy, setBusy]   = useState(false)
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    setOpen(false)
    setBusy(true)
    try {
      await downloadScopeLetter(sessionId)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setBusy(false)
    }
  }

  function handleEditor() {
    setOpen(false)
    navigate(`/reviews/${sessionId}/editor`)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)

    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="export-split" ref={ref}>
      <button
        className="btn-export"
        onClick={handleDownload}
        disabled={busy}
        title="Download highlighted scope letter"
      >
        <Download size={14} />
        {busy ? 'Exporting...' : 'Scope Letter'}
      </button>
      <button
        className="btn-export-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Export options"
      >
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="export-dropdown">
          <button className="export-dropdown-item" onClick={handleDownload}>
            <Download size={13} />
            Download .docx
          </button>
          <button className="export-dropdown-item" onClick={handleEditor}>
            <FilePenLine size={13} />
            Open in Editor
          </button>
        </div>
      )}
    </div>
  )
}

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

  const searchParams                          = new URLSearchParams(window.location.search)
  const initialTab                             = searchParams.get('tab') === 'action-items' ? 'action-items' : 'matches'
  const [activeTab, setActiveTab]             = useState<SessionTab>(initialTab)
  const [viewMode, setViewMode]               = useState<ViewMode>('erector')
  const [activeTypes, setActiveTypes]         = useState<Set<string>>(new Set())
  const [activeRisks, setActiveRisks]         = useState<Set<string>>(new Set())
  const [progress, setProgress]               = useState<SessionProgress | null>(null)
  const [highlightMatchId, setHighlightMatchId] = useState<number | null>(null)

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
    if (progress && (TERMINAL.has(progress.status) || !progress.is_active)) return

    async function poll() {
      try {
        const p = await getSessionProgress(sessionId)
        setProgress(p)

        if (TERMINAL.has(p.status) || !p.is_active) {
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

  // Action items: handle "View Match" → switch to matches tab + highlight
  const handleViewMatch = useCallback((matchId: number) => {
    setHighlightMatchId(matchId)
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

  const showProgress = progress && progress.is_active
  const showResults  = sess && (TERMINAL.has(String(sess.Status ?? '')) || (progress && !progress.is_active))

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
        {/* Progress card while actively running */}
        {progress && progress.is_active && <ProgressCard progress={progress} />}

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
                  <h2>Matches<span className="matches-view-label">: {{ erector: 'By Erector Item', accordion: 'By Category', table: 'Flat Table' }[viewMode]}</span></h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ExportButton sessionId={sessionId} />
                    <CustomSelect
                    options={[
                      { value: 'erector',   label: 'By Erector Item' },
                      { value: 'accordion', label: 'By Category' },
                      { value: 'table',     label: 'Flat Table' },
                    ]}
                    value={viewMode}
                    onChange={v => setViewMode(v as ViewMode)}
                  />
                  </div>
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
                  <MatchLegend viewMode={viewMode} />
                )}

                {!matches.loading && filtered.length > 0 && (
                  viewMode === 'erector'
                    ? <ErectorAccordion
                        matches={filtered}
                        categoryMap={categoryMap}
                        highlightMatchId={highlightMatchId}
                        onHighlightDone={() => setHighlightMatchId(null)}
                      />
                    : viewMode === 'accordion'
                      ? <CategoryAccordion
                          matches={filtered}
                          categoryMap={categoryMap}
                          highlightMatchId={highlightMatchId}
                          onHighlightDone={() => setHighlightMatchId(null)}
                        />
                      : <MatchTable
                          matches={filtered}
                          categoryMap={categoryMap}
                          highlightMatchId={highlightMatchId}
                          onHighlightDone={() => setHighlightMatchId(null)}
                        />
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
