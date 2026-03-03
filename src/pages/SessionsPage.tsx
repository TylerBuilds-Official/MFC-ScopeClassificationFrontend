import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/global/Header'
import StatusBadge from '../components/global/StatusBadge'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import CustomSelect from '../components/global/CustomSelect'
import { useApi } from '../hooks/useApi'
import { getSessions } from '../api/sessions'
import type { SessionListItem } from '../types/session'

import '@/styles/sessions.css'


type SortKey = keyof SessionListItem
type SortDir = 'asc' | 'desc'


export default function SessionsPage() {
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortKey, setSortKey]           = useState<SortKey>('id')
  const [sortDir, setSortDir]           = useState<SortDir>('desc')

  const { data, loading, error } = useApi(
    () => getSessions(100, 0, statusFilter || undefined),
    [statusFilter],
  )

  const sessions = data?.sessions ?? []

  const sorted = [...sessions].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1

    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0

    return sortDir === 'asc' ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <>
      <Header title="Analysis Sessions" />

      <main className="page-content">
        <div className="page-header">
          <h2>Sessions</h2>
          <div className="filter-bar">
            <CustomSelect
              options={[
                { value: '',           label: 'All Statuses' },
                { value: 'Complete',   label: 'Complete' },
                { value: 'Classified', label: 'Classified' },
                { value: 'Extracted',  label: 'Extracted' },
                { value: 'Ingested',   label: 'Ingested' },
                { value: 'Error',      label: 'Error' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>

        {loading && <LoadingSpinner message="Loading sessions..." />}
        {error && <EmptyState title="Error" message={error} />}

        {!loading && !error && sessions.length === 0 && (
          <EmptyState
            title="No sessions found"
            message="Run an analysis from the Analyze page to get started."
          />
        )}

        {!loading && !error && sessions.length > 0 && (
          <table className="session-grid">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')}>ID{sortIndicator('id')}</th>
                <th onClick={() => toggleSort('erector_name_raw')}>Erector{sortIndicator('erector_name_raw')}</th>
                <th onClick={() => toggleSort('job_number')}>Job #{sortIndicator('job_number')}</th>
                <th onClick={() => toggleSort('source_file_name')}>Source File{sortIndicator('source_file_name')}</th>
                <th onClick={() => toggleSort('status')}>Status{sortIndicator('status')}</th>
                <th onClick={() => toggleSort('total_aligned')}>Aligned{sortIndicator('total_aligned')}</th>
                <th onClick={() => toggleSort('total_erector_only')}>Erector Only{sortIndicator('total_erector_only')}</th>
                <th onClick={() => toggleSort('total_mfc_only')}>MFC Only{sortIndicator('total_mfc_only')}</th>
                <th onClick={() => toggleSort('created_at')}>Created{sortIndicator('created_at')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <td><span className="session-id">#{s.id}</span></td>
                  <td>{s.erector_name_raw ?? '—'}</td>
                  <td className="mono">{s.job_number ?? '—'}</td>
                  <td className="truncate" style={{ maxWidth: '220px' }}>{s.source_file_name ?? '—'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>{s.total_aligned ?? '—'}</td>
                  <td>{s.total_erector_only ?? '—'}</td>
                  <td>{s.total_mfc_only ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  )
}
