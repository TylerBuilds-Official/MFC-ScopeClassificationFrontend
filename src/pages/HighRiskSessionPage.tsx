import { useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardList, CheckCircle, Circle, Loader2 } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import MatchTable from '../components/matches/MatchTable'
import { useApi } from '../hooks/useApi'
import { useCategories } from '../hooks/useCategories'
import { getSession } from '../api/sessions'
import { getSessionMatches } from '../api/matches'
import { getSessionActionItems, updateActionItem } from '../api/actionItems'
import type { ActionItem } from '../types/actionItem'

import '../styles/matches.css'
import '../styles/sessions.css'


export default function HighRiskSessionPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const sessionId  = Number(id)

  const { categoryMap } = useCategories()

  const session     = useApi(() => getSession(sessionId), [sessionId])
  const matches     = useApi(() => getSessionMatches(sessionId), [sessionId])
  const actionItems = useApi(() => getSessionActionItems(sessionId), [sessionId])

  const [busyIds, setBusyIds] = useState<Set<number>>(new Set())

  const sess       = session.data?.session
  const allMatches = matches.data?.matches ?? []
  const allActions = actionItems.data?.items ?? []

  const highRisk = useMemo(
    () => allMatches.filter(m =>
      m.risk_level === 'Critical' || m.risk_level === 'High'
    ),
    [allMatches],
  )

  // Map match_id → action item for quick lookup
  const actionByMatchId = useMemo(() => {
    const map = new Map<number, ActionItem>()
    for (const item of allActions) {
      if (item.match_id != null) map.set(item.match_id, item)
    }

    return map
  }, [allActions])

  // Triage stats for high risk items
  const highRiskActions = useMemo(
    () => highRisk
      .map(m => actionByMatchId.get(m.id))
      .filter((a): a is ActionItem => a != null),
    [highRisk, actionByMatchId],
  )

  const totalHighRisk    = highRiskActions.length
  const addressedCount   = highRiskActions.filter(a => a.status === 'addressed').length
  const allAddressed     = totalHighRisk > 0 && addressedCount === totalHighRisk

  // Toggle addressed ↔ unreviewed
  const handleToggleStatus = useCallback(async (matchId: number) => {
    const action = actionByMatchId.get(matchId)
    if (!action) return

    const newStatus = action.status === 'addressed' ? 'unreviewed' : 'addressed'

    setBusyIds(prev => new Set(prev).add(action.id))
    try {
      await updateActionItem(action.id, { status: newStatus })
      actionItems.refetch()
    } catch (err) {
      console.error('Failed to update action item:', err)
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev)
        next.delete(action.id)

        return next
      })
    }
  }, [actionByMatchId, actionItems])

  const erector  = sess ? String((sess as Record<string, unknown>).ErectorNameRaw ?? 'Session') : 'Session'
  const jobNum   = sess ? String((sess as Record<string, unknown>).JobNumber ?? '')             : ''
  const jobName  = sess ? String((sess as Record<string, unknown>).JobName ?? '')               : ''
  const subtitle = [jobNum, jobName].filter(Boolean).join(' — ')

  return (
    <>
      <Header
        title={`${erector} #${id}`}
        breadcrumb={['High Risk', erector]}
      >
        <button
          className="btn-analyze"
          style={{ padding: '6px 14px', fontSize: '12.5px' }}
          onClick={() => navigate('/high-risk')}
        >
          ← Back
        </button>
      </Header>

      <main className="page-content">
        <div className="page-header">
          <div>
            <h2>High Risk Items</h2>
            {subtitle && (
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {subtitle}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {totalHighRisk > 0 && (
              <span className="filter-chip-count">
                {addressedCount} / {totalHighRisk} addressed
              </span>
            )}
            <button
              className="action-link-btn"
              onClick={() => navigate(`/sessions/${id}?tab=action-items`)}
            >
              <ClipboardList size={13} />
              Action Items
            </button>
          </div>
        </div>

        {/* All addressed banner */}
        {allAddressed && (
          <div className="hr-complete-banner">
            <CheckCircle size={18} />
            <div>
              <strong>All high risk items addressed</strong>
              <span>
                Review the full{' '}
                <button
                  className="hr-banner-link"
                  onClick={() => navigate(`/sessions/${id}?tab=action-items`)}
                >
                  action items list
                </button>
                {' '}to complete triage for this session.
              </span>
            </div>
          </div>
        )}

        {(session.loading || matches.loading) && (
          <LoadingSpinner message="Loading high-risk matches..." />
        )}

        {session.error && <EmptyState title="Error" message={session.error} />}
        {matches.error && <EmptyState title="Error" message={matches.error} />}

        {!matches.loading && !matches.error && highRisk.length === 0 && (
          <EmptyState
            title="No high-risk items"
            message="No matches flagged as High or Critical for this session."
            icon={<AlertTriangle size={36} />}
          />
        )}

        {!matches.loading && highRisk.length > 0 && (
          <MatchTable
            matches={highRisk}
            categoryMap={categoryMap}
            actionByMatchId={actionByMatchId}
            busyActionIds={busyIds}
            onToggleAddressed={handleToggleStatus}
          />
        )}
      </main>
    </>
  )
}
