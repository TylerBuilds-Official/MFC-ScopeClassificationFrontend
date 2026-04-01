import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { FilePenLine, Download, ArrowLeft, ChevronDown } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import CustomSelect from '../components/global/CustomSelect'
import SessionSummaryCard from '../components/sessions/SessionSummaryCard'
import ErectorAccordion from '../components/matches/ErectorAccordion'
import CategoryAccordion from '../components/matches/CategoryAccordion'
import MatchTable from '../components/matches/MatchTable'
import ActionItemsPanel from '../components/actions/ActionItemsPanel'
import { useApi } from '../hooks/useApi'
import { useCategories } from '../hooks/useCategories'
import { downloadScopeLetter } from '../api/export'
import { getSession } from '../api/sessions'
import { getSessionMatches } from '../api/matches'
import { getSessionActionItems } from '../api/actionItems'
import type { MatchRow } from '../types/match'

import '../styles/sessions.css'
import '../styles/matches.css'
import '../styles/action-items.css'


type ViewMode   = 'erector' | 'accordion' | 'table'
type ReviewTab  = 'matches' | 'action-items'

const MATCH_TYPES = ['Aligned', 'Partial', 'Deterministic', 'ErectorOnly', 'MfcOnly'] as const

const MATCH_TYPE_LABELS: Record<string, string> = {
  Aligned:       'Aligned',
  Partial:       'Partial',
  Deterministic: 'Auto-Matched',
  ErectorOnly:   'Erector Only',
  MfcOnly:       'Mfc Only',
}


export default function ScopeReviewDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const sessionId = Number(id)

  const [activeTab, setActiveTab]     = useState<ReviewTab>('matches')
  const [viewMode, setViewMode]       = useState<ViewMode>('erector')
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())
  const [highlightMatchId, setHighlightMatchId] = useState<number | null>(null)
  const [exporting, setExporting]     = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportMenuOpen) return

    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportMenuOpen])

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

  const matchRows = matches.data?.matches ?? []

  const filtered = useMemo(() => {
    // Suppress ErectorOnly rows when a Deterministic match exists for the same extraction
    const deterministicExtractions = new Set(
      matchRows
        .filter(m => m.match_type === 'Deterministic')
        .map(m => m.extracted_exclusion_id)
    )

    let rows: MatchRow[] = matchRows.filter(m => {
      if (deterministicExtractions.has(m.extracted_exclusion_id)) {
        if (m.match_type === 'ErectorOnly') return false
        if (m.match_type !== 'Deterministic' && (m.confidence ?? 0) < 0.80) return false
      }

      return true
    })

    if (activeTypes.size > 0) {
      rows = rows.filter(m => m.match_type != null && activeTypes.has(m.match_type))
    }

    return rows
  }, [matchRows, activeTypes])

  function toggleFilter(value: string) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else                 next.add(value)

      return next
    })
  }

  const hasFilters = activeTypes.size > 0

  const handleViewMatch = useCallback((matchId: number) => {
    setHighlightMatchId(matchId)
    setActiveTab('matches')
  }, [])

  const unreviewedCount = actionItems.data?.summary?.unreviewed ?? 0

  async function handleExport(viewMode: string = 'full') {
    setExporting(true)
    setExportMenuOpen(false)
    try {
      await downloadScopeLetter(sessionId, viewMode)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (session.loading) return (
    <>
      <Header title="Scope Review" breadcrumb={['Erector vs MFC', `#${id}`]} />
      <main className="page-content"><LoadingSpinner message="Loading review..." /></main>
    </>
  )

  if (session.error || !session.data) return (
    <>
      <Header title="Scope Review" breadcrumb={['Erector vs MFC', `#${id}`]} />
      <main className="page-content">
        <EmptyState title="Review not found" message={session.error ?? 'No data returned.'} />
      </main>
    </>
  )

  const sess    = session.data?.session as Record<string, unknown> | undefined
  const summary = session.data?.match_summary

  if (!sess || !summary) return (
    <>
      <Header title="Scope Review" breadcrumb={['Erector vs MFC', `#${id}`]} />
      <main className="page-content">
        <EmptyState title="Waiting for data" message="Review data is not yet available." />
      </main>
    </>
  )

  return (
    <>
      <Header
        title={`${sess.ErectorNameRaw ?? 'Erector'} vs MFC`}
        breadcrumb={['Erector vs MFC', String(sess.ErectorNameRaw ?? `#${id}`)]}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-analyze"
            onClick={() => navigate(`/reviews/${sessionId}/editor`)}
          >
            <FilePenLine size={14} />
            Open Editor
          </button>
          <div style={{ position: 'relative' }} ref={exportMenuRef}>
            <button
              className="btn-analyze secondary"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              disabled={exporting}
            >
              <Download size={14} />
              {exporting ? 'Exporting...' : 'Download'}
              <ChevronDown size={12} />
            </button>
            {exportMenuOpen && (
              <div className="editor-overflow-menu" style={{ left: 0, right: 'auto' }}>
                <button
                  className="editor-overflow-item"
                  onClick={() => handleExport('erector_exclusions')}
                >
                  Erector Section
                </button>
                <button
                  className="editor-overflow-item"
                  onClick={() => handleExport('full')}
                >
                  Full Document
                </button>
              </div>
            )}
          </div>
          <button
            className="btn-analyze secondary"
            onClick={() => navigate('/reviews')}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
      </Header>

      <main className="page-content">
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

        {/* ── Matches Tab ──────────────────────────────────── */}
        {activeTab === 'matches' && (
          <>
            <div className="page-header" style={{ marginTop: 16 }}>
              <h2>Matches<span className="matches-view-label">: {{ erector: 'By Erector Item', accordion: 'By Category', table: 'Flat Table' }[viewMode]}</span></h2>
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

            {/* Match type filters only — no risk filters */}
            <div className="filter-chip-bar">
              <span className="filter-chip-label">Type</span>
              {MATCH_TYPES.map(t => (
                <button
                  key={t}
                  className={`filter-chip ${activeTypes.has(t) ? 'active' : ''}`}
                  data-type={t.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}
                  onClick={() => toggleFilter(t)}
                >
                  {MATCH_TYPE_LABELS[t] ?? t}
                </button>
              ))}

              {hasFilters && (
                <button
                  className="filter-chip clear"
                  onClick={() => setActiveTypes(new Set())}
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
                  : 'No comparison data for this review yet.'}
              />
            )}

            {!matches.loading && filtered.length > 0 && (
              viewMode === 'erector'
                ? <ErectorAccordion
                    matches={filtered}
                    categoryMap={categoryMap}
                    showRisk={false}
                    erectorName={sess.ErectorNameRaw as string | undefined}
                    highlightMatchId={highlightMatchId}
                    onHighlightDone={() => setHighlightMatchId(null)}
                  />
                : viewMode === 'accordion'
                  ? <CategoryAccordion
                      matches={filtered}
                      categoryMap={categoryMap}
                      showRisk={false}
                      highlightMatchId={highlightMatchId}
                      onHighlightDone={() => setHighlightMatchId(null)}
                    />
                  : <MatchTable
                      matches={filtered}
                      categoryMap={categoryMap}
                      showRisk={false}
                      highlightMatchId={highlightMatchId}
                      onHighlightDone={() => setHighlightMatchId(null)}
                    />
            )}
          </>
        )}

        {/* ── Action Items Tab ─────────────────────────────── */}
        {activeTab === 'action-items' && (
          <div style={{ marginTop: 16 }}>
            <ActionItemsPanel
              sessionId={sessionId}
              showRisk={false}
              onViewMatch={handleViewMatch}
            />
          </div>
        )}
      </main>
    </>
  )
}
