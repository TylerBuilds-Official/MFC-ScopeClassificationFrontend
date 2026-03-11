import { useNavigate } from 'react-router-dom'
import { Plus, GitCompareArrows } from 'lucide-react'

import Header from '../components/global/Header'
import StatusBadge from '../components/global/StatusBadge'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import { useApi } from '../hooks/useApi'
import { getComparisons } from '../api/comparison'

import '../styles/sessions.css'
import '../styles/comparison.css'


export default function ComparisonsPage() {
  const navigate = useNavigate()

  const { data, loading, error } = useApi(
    () => getComparisons(100, 0),
    [],
  )

  const comparisons = data?.comparisons ?? []

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Compare Erectors">
        <button className="btn-analyze" onClick={() => navigate('/compare/new')}>
          <Plus size={14} />
          New Comparison
        </button>
      </Header>

      <main className="page-content">
        <div className="page-header">
          <h2>Erector Comparisons</h2>
        </div>

        {loading && <LoadingSpinner message="Loading comparisons..." />}
        {error && <EmptyState title="Error" message={error} />}

        {!loading && !error && comparisons.length === 0 && (
          <EmptyState
            title="No comparisons yet"
            message="Upload scope letters from multiple erectors to see how they compare."
            icon={<GitCompareArrows size={32} />}
          />
        )}

        {!loading && !error && comparisons.length > 0 && (
          <table className="session-grid">
            <thead>
              <tr>
                <th>ID</th>
                <th>Job #</th>
                <th>Job Name</th>
                <th>Erectors</th>
                <th>Status</th>
                <th>Unified Items</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map(c => (
                <tr key={c.id} onClick={() => navigate(`/compare/${c.id}`)}>
                  <td><span className="session-id">#{c.id}</span></td>
                  <td className="mono">{c.job_number ?? '—'}</td>
                  <td className="truncate" style={{ maxWidth: '200px' }}>{c.job_name ?? '—'}</td>
                  <td>
                    <div className="erector-pills">
                      {c.erector_names.length > 0
                        ? c.erector_names.map((name, i) => (
                            <span key={i} className="erector-pill">{name}</span>
                          ))
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </div>
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.status === 'Complete'
                      ? <span className="mono">{c.total_unified}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  )
}
