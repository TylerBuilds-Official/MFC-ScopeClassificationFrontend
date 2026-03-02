import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import HeatmapGrid from '../components/heatmap/HeatmapGrid'
import { useApi } from '../hooks/useApi'
import { getHeatmap } from '../api/categories'

import '@/styles/heatmap.css'


export default function HeatmapPage() {
  const { data, loading, error } = useApi(() => getHeatmap(), [])

  const cells = data?.data ?? []

  return (
    <>
      <Header title="Category Heatmap" />

      <main className="page-content">
        <div className="page-header">
          <h2>Gap Distribution</h2>
        </div>

        {loading && <LoadingSpinner message="Loading heatmap data..." />}
        {error && <EmptyState title="Error" message={error} />}

        {!loading && !error && cells.length === 0 && (
          <EmptyState
            title="No data yet"
            message="Run some analyses first to populate the heatmap."
          />
        )}

        {!loading && !error && cells.length > 0 && (
          <HeatmapGrid data={cells} />
        )}
      </main>
    </>
  )
}
