import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Upload, X, RefreshCw } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import ComparisonProgressCard from '../components/comparison/ComparisonProgressCard'
import { useApi } from '../hooks/useApi'
import { getComparison, getComparisonProgress, addErectorUpload, rerunComparison } from '../api/comparison'
import type { ComparisonResult, ComparisonProgress, UnifiedItem, CoverageCell, ComparisonErector } from '../types/comparison'

import '../styles/comparison.css'


const TERMINAL = new Set(['Complete', 'Error'])
const POLL_MS  = 3000


/* ── Coverage Pill ──────────────────────────────────────────────── */

function CoveragePill({ cell, dimmed }: { cell: CoverageCell | undefined; dimmed?: boolean }) {
  if (!cell || cell.type === 'NotMentioned') {
    return <td className="cov-cell cov-not-mentioned"><span className={`cov-pill not-mentioned ${dimmed ? 'cov-dimmed' : ''}`}>—</span></td>
  }

  const cls = cell.type === 'Excludes' ? 'excludes' : 'includes'

  return (
    <td className={`cov-cell cov-${cls}`}>
      <span className={`cov-pill ${cls} ${dimmed ? 'cov-dimmed' : ''}`}>{cell.type === 'Excludes' ? 'Excludes' : 'Includes'}</span>
    </td>
  )
}


/* ── Expanded Row Detail ────────────────────────────────────────── */

function ExpandedRowDetail({ item, erectors, highlightErector }: {
  item:             UnifiedItem
  erectors:         ComparisonErector[]
  highlightErector: string | null
}) {
  const visible = highlightErector
    ? erectors.filter(e => String(e.AnalysisSessionId) === highlightErector)
    : erectors

  return (
    <tr className="matrix-expanded-row">
      <td colSpan={erectors.length + 1}>
        <div className="expanded-detail">
          {visible.map(e => {
            const cell = item.coverage[String(e.AnalysisSessionId)]
            const type = cell?.type ?? 'NotMentioned'

            return (
              <div key={e.AnalysisSessionId} className={`expanded-erector expanded-${type.toLowerCase()}`}>
                <span className="expanded-erector-name">{e.ErectorNameRaw ?? 'Unknown'}</span>
                <span className={`expanded-type-badge ${type.toLowerCase()}`}>{type === 'NotMentioned' ? 'Not Mentioned' : type}</span>
                {cell?.raw
                  ? <p className="expanded-raw-text">{cell.raw}</p>
                  : <p className="expanded-raw-empty">{type === 'NotMentioned' ? 'This erector did not address this item.' : 'No raw text available.'}</p>
                }
              </div>
            )
          })}
        </div>
      </td>
    </tr>
  )
}


/* ── Add Erector Dialog ─────────────────────────────────────────── */

function AddErectorPanel({ comparisonId, jobNumber, onAdded }: {
  comparisonId: number
  jobNumber:    string | null
  onAdded:      () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile]             = useState<File | null>(null)
  const [erectorName, setErectorName] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit() {
    if (!file || !erectorName.trim()) return

    setLoading(true)
    setError(null)

    try {
      await addErectorUpload(comparisonId, file, erectorName.trim(), jobNumber ?? undefined)
      setFile(null)
      setErectorName('')
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add erector')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-erector-panel">
      <h4>Add Erector</h4>
      <div className="add-erector-fields">
        <button className="add-erector-file-btn" onClick={() => fileRef.current?.click()}>
          <Upload size={14} />
          {file ? file.name : 'Choose PDF'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          style={{ display: 'none' }}
        />
        <input
          type="text"
          className="field-input"
          placeholder="Erector name"
          value={erectorName}
          onChange={e => setErectorName(e.target.value)}
        />
        <button
          className="btn-analyze"
          disabled={!file || !erectorName.trim() || loading}
          onClick={handleSubmit}
          style={{ padding: '6px 14px', fontSize: '12.5px' }}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      {error && <div className="compare-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  )
}


/* ── Main Page ──────────────────────────────────────────────────── */

export default function ComparisonDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const compId    = Number(id)

  const [progress, setProgress]     = useState<ComparisonProgress | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null)
  const [highlightErector, setHighlightErector] = useState<string | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [diffOnly, setDiffOnly]     = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [rerunning, setRerunning]   = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data, loading, error, refetch } = useApi(
    () => getComparison(compId),
    [compId],
  )

  const result = data as ComparisonResult | null
  const status = result?.comparison_session?.Status

  // Poll while running
  useEffect(() => {
    if (status && TERMINAL.has(status)) return

    async function poll() {
      try {
        const p = await getComparisonProgress(compId)
        setProgress(p)

        if (TERMINAL.has(p.status) || !p.is_active) {
          refetch()

          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        }
      } catch { /* ignore transient */ }
    }

    poll()
    pollRef.current = setInterval(poll, POLL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [compId, status])

  // Erector column headers
  const erectors = result?.erectors ?? []

  // Compute diff counts for the view toggle labels
  const diffCounts = useMemo(() => {
    const all  = result?.unified_items ?? []
    let pool   = categoryFilter ? all.filter(i => i.category === categoryFilter) : all

    const diffs = pool.filter(item => {
      const types = Object.values(item.coverage).map(c => c.type)
      return new Set(types).size > 1
    })

    return { all: pool.length, diffs: diffs.length }
  }, [result?.unified_items, categoryFilter])

  // Filter items
  const filteredItems = useMemo(() => {
    let items = result?.unified_items ?? []

    if (categoryFilter) {
      items = items.filter(i => i.category === categoryFilter)
    }

    if (diffOnly) {
      items = items.filter(item => {
        const types = Object.values(item.coverage).map(c => c.type)
        return new Set(types).size > 1
      })
    }

    return items
  }, [result?.unified_items, categoryFilter, diffOnly])

  // Unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const item of (result?.unified_items ?? [])) {
      if (item.category) cats.add(item.category)
    }
    return Array.from(cats).sort()
  }, [result?.unified_items])

  // Group items by category for display
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: UnifiedItem[] }[] = []
    const map = new Map<string, UnifiedItem[]>()

    for (const item of filteredItems) {
      const cat = item.category ?? 'Uncategorized'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }

    for (const [category, items] of map) {
      groups.push({ category, items })
    }

    return groups
  }, [filteredItems])

  const handleRowClick = useCallback((itemId: number) => {
    setExpandedItemId(prev => prev === itemId ? null : itemId)
  }, [])

  async function handleRerun() {
    setRerunning(true)
    try {
      await rerunComparison(compId)
      setProgress(null)  // Reset so polling restarts
      refetch()
    } catch (err) {
      console.error('Re-run failed:', err)
    } finally {
      setRerunning(false)
    }
  }

  const isRunning  = progress && !TERMINAL.has(progress.status) && progress.is_active
  const isStalled   = progress && !TERMINAL.has(progress.status) && !progress.is_active

  // Show progress while actively running
  if ((loading && !result) || isRunning) {
    return (
      <>
        <Header title="Comparison" breadcrumb={['Compare Erectors', `#${id}`]}>
          <button className="btn-analyze" style={{ padding: '6px 14px', fontSize: '12.5px' }} onClick={() => navigate('/compare')}>
            <ArrowLeft size={14} />
            Back
          </button>
        </Header>
        <main className="page-content">
          {progress
            ? <ComparisonProgressCard progress={progress} />
            : <LoadingSpinner message="Loading comparison..." />
          }
        </main>
      </>
    )
  }

  if (error || !result) {
    return (
      <>
        <Header title="Comparison" breadcrumb={['Compare Erectors', `#${id}`]} />
        <main className="page-content">
          <EmptyState title="Comparison not found" message={error ?? 'No data returned.'} />
        </main>
      </>
    )
  }

  if (result.comparison_session.Status === 'Error') {
    // Build a synthetic progress object from the comparison session for the error card
    const errorProgress: ComparisonProgress = {
      comparison_id:      compId,
      status:             'Error',
      is_active:          false,
      current_phase:      'Error',
      erectors_analyzed:  0,
      total_erectors:     result.comparison_session.TotalErectors,
      total_unified:      result.comparison_session.TotalUnified,
      error_message:      result.comparison_session.ErrorMessage,
    }

    return (
      <>
        <Header title="Comparison" breadcrumb={['Compare Erectors', `#${id}`]}>
          <button className="btn-analyze" style={{ padding: '6px 14px', fontSize: '12.5px' }} onClick={() => navigate('/compare')}>
            <ArrowLeft size={14} />
            Back
          </button>
        </Header>
        <main className="page-content">
          <ComparisonProgressCard progress={errorProgress} />
          <button className="btn-analyze" onClick={handleRerun} disabled={rerunning} style={{ marginTop: 12 }}>
            <RefreshCw size={14} />
            {rerunning ? 'Re-running...' : 'Re-run Comparison'}
          </button>
        </main>
      </>
    )
  }

  // Stalled state (thread died — status is non-terminal but nothing is active)
  if (isStalled || result.comparison_session.Status === 'Pending' || (result.comparison_session.Status === 'Running' && !progress?.is_active)) {
    return (
      <>
        <Header title={`Comparison #${id}`} breadcrumb={['Compare Erectors', `#${id}`]}>
          <button className="btn-analyze" style={{ padding: '6px 14px', fontSize: '12.5px' }} onClick={() => navigate('/compare')}>
            <ArrowLeft size={14} />
            Back
          </button>
        </Header>
        <main className="page-content">
          <EmptyState
            title="Comparison stalled"
            message="The comparison was interrupted. Click Re-run to restart grouping."
          />
          <button className="btn-analyze" onClick={handleRerun} disabled={rerunning} style={{ marginTop: 12 }}>
            <RefreshCw size={14} />
            {rerunning ? 'Re-running...' : 'Re-run Comparison'}
          </button>
        </main>
      </>
    )
  }

  const session = result.comparison_session
  const totalItems = result.unified_items.length

  return (
    <>
      <Header title={`Comparison #${id}`} breadcrumb={['Compare Erectors', `#${id}`]}>
        <button className="btn-analyze" style={{ padding: '6px 14px', fontSize: '12.5px' }} onClick={() => navigate('/compare')}>
          <ArrowLeft size={14} />
          Back
        </button>
      </Header>

      <main className="page-content">

        {/* Summary bar */}
        <div className="compare-summary">
          <div className="compare-summary-item">
            <span className="compare-summary-label">Job</span>
            <span className="compare-summary-value mono">{session.JobNumber ?? '—'}</span>
            {session.JobName && <span className="compare-summary-sub">{session.JobName}</span>}
          </div>
          <div className="compare-summary-item">
            <span className="compare-summary-label">Erectors</span>
            <span className="compare-summary-value">{erectors.length}</span>
          </div>
          <div className="compare-summary-item">
            <span className="compare-summary-label">Items Compared</span>
            <span className="compare-summary-value">{totalItems}</span>
          </div>
          <div className="compare-summary-item">
            <span className="compare-summary-label">Showing</span>
            <span className="compare-summary-value">{filteredItems.length}</span>
          </div>
        </div>

        {/* View toggle + filters */}
        <div className="compare-toolbar">
          <div className="compare-toolbar-left">
            <div className="compare-view-toggle">
              <button
                className={`view-toggle-btn ${!diffOnly ? 'active' : ''}`}
                onClick={() => setDiffOnly(false)}
              >
                All Items
                <span className="view-toggle-count">{diffCounts.all}</span>
              </button>
              <button
                className={`view-toggle-btn ${diffOnly ? 'active' : ''}`}
                onClick={() => setDiffOnly(true)}
              >
                Gaps &amp; Differences
                <span className="view-toggle-count">{diffCounts.diffs}</span>
              </button>
            </div>

            <span className="compare-toolbar-sep" />

            {categoryFilter && (
              <button className="filter-chip active" onClick={() => setCategoryFilter(null)}>
                {categoryFilter}
                <X size={12} />
              </button>
            )}

            {!categoryFilter && categories.length > 1 && (
              <select
                className="compare-category-select"
                value=""
                onChange={e => setCategoryFilter(e.target.value || null)}
              >
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {erectors.length > 1 && (
              <select
                className="compare-category-select"
                value={highlightErector ?? ''}
                onChange={e => setHighlightErector(e.target.value || null)}
              >
                <option value="">All erectors</option>
                {erectors.map(e => (
                  <option key={e.AnalysisSessionId} value={String(e.AnalysisSessionId)}>
                    {e.ErectorNameRaw ?? `Session ${e.AnalysisSessionId}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            className="btn-analyze"
            style={{ padding: '6px 14px', fontSize: '12.5px' }}
            onClick={() => setShowAddPanel(!showAddPanel)}
          >
            <Plus size={14} />
            Add Erector
          </button>
        </div>

        {/* Add erector panel */}
        {showAddPanel && (
          <AddErectorPanel
            comparisonId={compId}
            jobNumber={session.JobNumber}
            onAdded={() => { setShowAddPanel(false); refetch() }}
          />
        )}

        {/* Matrix */}
        {groupedItems.length === 0 && (
          <EmptyState
            title={diffOnly ? 'No differences found' : 'No items'}
            message={diffOnly ? 'All erectors have the same coverage for the current filters.' : 'No unified items in this comparison.'}
          />
        )}

        {groupedItems.length > 0 && (
          <div className="compare-matrix-wrapper">
            <table className="compare-matrix">
              <thead>
                <tr>
                  <th className="matrix-item-col">Scope Item</th>
                  {erectors.map(e => {
                    const sid     = String(e.AnalysisSessionId)
                    const dimmed  = highlightErector != null && highlightErector !== sid

                    return (
                      <th
                        key={e.AnalysisSessionId}
                        className={`matrix-erector-col ${dimmed ? 'col-dimmed' : ''} ${highlightErector === sid ? 'col-highlighted' : ''}`}
                      >
                        {e.ErectorNameRaw ?? `Session ${e.AnalysisSessionId}`}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {groupedItems.map(group => (
                  <Fragment key={`cat-${group.category}`}>
                    <tr className="matrix-category-row">
                      <td colSpan={erectors.length + 1} className="matrix-category-label">
                        {group.category}
                        <span className="matrix-category-count">{group.items.length}</span>
                      </td>
                    </tr>
                    {group.items.map(item => {
                      const isExpanded = expandedItemId === item.id

                      return (
                        <Fragment key={item.id}>
                          <tr
                            className={`matrix-item-row ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => handleRowClick(item.id)}
                          >
                            <td className="matrix-item-desc">
                              <span className="matrix-expand-icon">{isExpanded ? '▾' : '▸'}</span>
                              {item.description}
                            </td>
                            {erectors.map(e => {
                              const sid    = String(e.AnalysisSessionId)
                              const dimmed = highlightErector != null && highlightErector !== sid

                              return (
                                <CoveragePill
                                  key={e.AnalysisSessionId}
                                  cell={item.coverage[sid]}
                                  dimmed={dimmed}
                                />
                              )
                            })}
                          </tr>
                          {isExpanded && (
                            <ExpandedRowDetail
                              item={item}
                              erectors={erectors}
                              highlightErector={highlightErector}
                            />
                          )}
                        </Fragment>
                      )
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
