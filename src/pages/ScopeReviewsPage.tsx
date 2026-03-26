import { useNavigate }    from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'

import Header             from '../components/global/Header'
import LoadingSpinner     from '../components/global/LoadingSpinner'
import EmptyState         from '../components/global/EmptyState'
import { useApi }         from '../hooks/useApi'
import { getSessions }    from '../api/sessions'

import '../styles/sessions.css'


export default function ScopeReviewsPage() {
  const navigate = useNavigate()

  const { data, loading, error } = useApi(
    () => getSessions(100, 0, 'Complete'),
    [],
  )

  const sessions = data?.sessions ?? []

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Erector vs MFC">
        <button className="btn-analyze" onClick={() => navigate('/reviews/new')}>
          <Plus size={14} />
          New Review
        </button>
      </Header>

      <main className="page-content">
        <div className="page-header">
          <h2>Scope Reviews</h2>
        </div>

        {loading && <LoadingSpinner message="Loading reviews..." />}
        {error && <EmptyState title="Error" message={error} />}

        {!loading && !error && sessions.length === 0 && (
          <EmptyState
            title="No completed reviews"
            message="Run an analysis from the Analyze page to compare an erector's scope letter against MFC exclusions."
            icon={<FileText size={32} />}
          />
        )}

        {!loading && !error && sessions.length > 0 && (
          <table className="session-grid">
            <thead>
              <tr>
                <th>Erector</th>
                <th>Job #</th>
                <th>Job Name</th>
                <th>Aligned</th>
                <th>Partial</th>
                <th>Erector Only</th>
                <th>MFC Only</th>
                <th>Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} onClick={() => navigate(`/reviews/${s.id}`)}>
                  <td style={{ fontWeight: 500 }}>{s.erector_name_raw ?? '—'}</td>
                  <td className="mono">{s.job_number ?? '—'}</td>
                  <td className="truncate" style={{ maxWidth: '220px' }}>{s.job_name ?? '—'}</td>
                  <td className="match-val aligned">{s.total_aligned ?? '—'}</td>
                  <td className="match-val partial">{s.total_partial ?? '—'}</td>
                  <td className="match-val erector-only">{s.total_erector_only ?? '—'}</td>
                  <td className="match-val mfc-only">{s.total_mfc_only ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  )
}
