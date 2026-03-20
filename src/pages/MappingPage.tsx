import { useState, useMemo, useCallback } from 'react'

import Header from '../components/global/Header'
import MappingStatsBar from '../components/mapping/MappingStatsBar'
import MappingToolbar from '../components/mapping/MappingToolbar'
import MappingTable from '../components/mapping/MappingTable'
import BulkLinkPanel from '../components/mapping/BulkLinkPanel'
import { useApi } from '../hooks/useApi'
import { getErectorExclusions, getMfcOptions, getMappingStats } from '../api/mapping'
import type { Disposition } from '../types/mapping'

import '../styles/mapping.css'


export default function MappingPage() {

  // ── Filters ─────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter]     = useState<number | null>(null)
  const [erectorFilter, setErectorFilter]       = useState<number | null>(null)
  const [dispositionFilter, setDispositionFilter] = useState<Disposition | null>(null)

  // ── Bulk mode ───────────────────────────────────────────────
  const [bulkMode, setBulkMode]         = useState(false)
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set())

  // ── Data fetching ───────────────────────────────────────────
  const filters = useMemo(() => ({
    category_id: categoryFilter ?? undefined,
    erector_id:  erectorFilter ?? undefined,
    disposition: dispositionFilter ?? undefined,
  }), [categoryFilter, erectorFilter, dispositionFilter])

  const { data: eeData, refetch: refetchEE } = useApi(
    () => getErectorExclusions(filters),
    [categoryFilter, erectorFilter, dispositionFilter],
  )

  const { data: mfcData } = useApi(() => getMfcOptions(), [])

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useApi(
    () => getMappingStats(), [],
  )

  const items      = eeData?.items ?? []
  const mfcOptions = mfcData?.items ?? []

  // ── Derived filter options ──────────────────────────────────
  const categoryOptions = useMemo(() => {
    const seen = new Map<number, string>()
    for (const item of items) {
      if (!seen.has(item.CategoryId)) seen.set(item.CategoryId, item.CategoryName)
    }

    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  const erectorOptions = useMemo(() => {
    const seen = new Map<number, string>()
    for (const item of items) {
      if (!seen.has(item.ErectorId)) seen.set(item.ErectorId, item.ErectorShortName)
    }

    return Array.from(seen.entries()).map(([id, shortName]) => ({ id, shortName }))
  }, [items])

  // ── Handlers ────────────────────────────────────────────────
  const handleRefreshAll = useCallback(() => {
    refetchEE()
    refetchStats()
  }, [refetchEE, refetchStats])

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
      <Header title="Erector Exclusion Mapping" />

      <main className="page-content">
        <MappingStatsBar stats={stats ?? null} loading={statsLoading} />

        <MappingToolbar
          categories={categoryOptions}
          erectors={erectorOptions}
          categoryFilter={categoryFilter}
          erectorFilter={erectorFilter}
          dispositionFilter={dispositionFilter}
          onCategoryChange={setCategoryFilter}
          onErectorChange={setErectorFilter}
          onDispositionChange={setDispositionFilter}
          bulkMode={bulkMode}
          onToggleBulk={handleToggleBulkMode}
          bulkCount={bulkSelected.size}
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
