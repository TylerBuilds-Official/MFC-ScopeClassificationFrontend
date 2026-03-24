import { useState, useMemo, useCallback } from 'react'

import Header from '../components/global/Header'
import MappingStatsBar from '../components/mapping/MappingStatsBar'
import MappingToolbar from '../components/mapping/MappingToolbar'
import MappingTable from '../components/mapping/MappingTable'
import BulkLinkPanel from '../components/mapping/BulkLinkPanel'
import AddExclusionDialog from '../components/mapping/AddExclusionDialog'
import { useApi } from '../hooks/useApi'
import { getAtomicExclusions, getMfcOptions, getErectors, getMappingStats } from '../api/mapping'
import { getCategories } from '../api/categories'
import type { Disposition } from '../types/mapping'

import '../styles/mapping.css'


export default function MappingPage() {

  // ── Filters ─────────────────────────────────────────────────
  const [erectorFilter, setErectorFilter]       = useState<number | null>(null)
  const [dispositionFilter, setDispositionFilter] = useState<Disposition | null>(null)

  // ── Bulk mode ───────────────────────────────────────────────
  const [bulkMode, setBulkMode]         = useState(false)
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set())

  // ── Add dialog ──────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false)

  // ── Data fetching ───────────────────────────────────────────
  const filters = useMemo(() => ({
    erector_id:  erectorFilter ?? undefined,
    disposition: dispositionFilter ?? undefined,
  }), [erectorFilter, dispositionFilter])

  const { data: aeData, refetch: refetchAE } = useApi(
    () => getAtomicExclusions(filters),
    [erectorFilter, dispositionFilter],
  )

  const { data: mfcData, refetch: refetchMfc } = useApi(() => getMfcOptions(), [])
  const { data: erectorData }  = useApi(() => getErectors(), [])
  const { data: categoryData } = useApi(() => getCategories(), [])

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi(
    () => getMappingStats(), [],
  )

  const items         = aeData?.items ?? []
  const mfcOptions    = mfcData?.items ?? []
  const erectorOpts   = erectorData?.items ?? []
  const categoryOpts  = categoryData?.categories ?? []

  // ── Handlers ────────────────────────────────────────────────
  const handleRefreshAll = useCallback(() => {
    refetchAE()
    refetchStats()
    refetchMfc()
  }, [refetchAE, refetchStats, refetchMfc])

  function handleToggleBulk(id: number) {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }

  function handleBulkComplete() {
    setBulkSelected(new Set())
    handleRefreshAll()
  }

  function handleToggleBulkMode() {
    setBulkMode(!bulkMode)
    if (bulkMode) setBulkSelected(new Set())
  }

  return (
    <>
      <Header title="Exclusion Mapping" />

      <main className="page-content">
        <MappingStatsBar stats={stats ?? null} loading={statsLoading} />

        <MappingToolbar
          erectors={erectorOpts}
          erectorFilter={erectorFilter}
          dispositionFilter={dispositionFilter}
          onErectorChange={setErectorFilter}
          onDispositionChange={setDispositionFilter}
          bulkMode={bulkMode}
          onToggleBulk={handleToggleBulkMode}
          bulkCount={bulkSelected.size}
          onAddExclusion={() => setShowAddDialog(true)}
        />

        <AddExclusionDialog
          open={showAddDialog}
          categories={categoryOpts}
          onClose={() => setShowAddDialog(false)}
          onAdded={handleRefreshAll}
        />

        <div className={`bulk-panel-wrap ${bulkMode ? 'open' : ''}`}>
          <div className="bulk-panel-inner">
            <BulkLinkPanel
              selectedIds={bulkSelected}
              items={items}
              mfcOptions={mfcOptions}
              onComplete={handleBulkComplete}
              onClearSelection={() => setBulkSelected(new Set())}
            />
          </div>
        </div>

        <MappingTable
          items={items}
          mfcOptions={mfcOptions}
          bulkMode={bulkMode}
          bulkSelected={bulkSelected}
          onToggleBulk={handleToggleBulk}
          onLinkCreated={handleRefreshAll}
          onDispositionChanged={handleRefreshAll}
          onErectorClick={id => setErectorFilter(prev => prev === id ? null : id)}
        />
      </main>
    </>
  )
}
