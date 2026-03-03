import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, ClipboardList } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import MatchTable from '../components/matches/MatchTable'
import { useApi } from '../hooks/useApi'
import { useCategories } from '../hooks/useCategories'
import { getSession } from '../api/sessions'
import { getSessionMatches } from '../api/matches'

import '../styles/matches.css'
import '../styles/sessions.css'


export default function HighRiskSessionPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const sessionId  = Number(id)

  const { categoryMap } = useCategories()

  const session = useApi(
    () => getSession(sessionId),
    [sessionId],
  )

  const matches = useApi(
    () => getSessionMatches(sessionId),
    [sessionId],
  )

  const sess       = session.data?.session
  const allMatches = matches.data?.matches ?? []

  const highRisk = useMemo(
    () => allMatches.filter(m =>
      m.risk_level === 'Critical' || m.risk_level === 'High'
    ),
    [allMatches],
  )

  const erector = sess ? String(sess.ErectorNameRaw ?? 'Session') : `Session`
  const jobNum  = sess ? String(sess.JobNumber ?? '')              : ''
  const jobName = sess ? String(sess.JobName ?? '')                : ''
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
            <span className="filter-chip-count">
              {highRisk.length} item{highRisk.length !== 1 ? 's' : ''}
            </span>
            <button
              className="action-link-btn"
              onClick={() => navigate(`/sessions/${id}?tab=action-items`)}
            >
              <ClipboardList size={13} />
              Action Items
            </button>
          </div>
        </div>

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
          <MatchTable matches={highRisk} categoryMap={categoryMap} />
        )}
      </main>
    </>
  )
}
