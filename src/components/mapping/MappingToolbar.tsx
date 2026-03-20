import { useMemo } from 'react'
import { Filter } from 'lucide-react'
import CustomSelect from '../global/CustomSelect'
import type { Disposition } from '../../types/mapping'


interface CategoryOption {
  id:   number
  name: string
}

interface ErectorOption {
  id:        number
  shortName: string
}

interface Props {
  categories:      CategoryOption[]
  erectors:        ErectorOption[]
  categoryFilter:  number | null
  erectorFilter:   number | null
  dispositionFilter: Disposition | null
  onCategoryChange:    (id: number | null) => void
  onErectorChange:     (id: number | null) => void
  onDispositionChange: (d: Disposition | null) => void
  bulkMode:        boolean
  onToggleBulk:    () => void
  bulkCount:       number
}


const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: 'Unmapped',     label: 'Unmapped' },
  { value: 'Mapped',       label: 'Mapped' },
  { value: 'PMReportOnly', label: 'PM Report' },
]


/**
 * Filter bar + bulk mode toggle for the mapping page.
 */
export default function MappingToolbar({
    categories, erectors,
    categoryFilter, erectorFilter, dispositionFilter,
    onCategoryChange, onErectorChange, onDispositionChange,
    bulkMode, onToggleBulk, bulkCount }: Props) {

  const categoryOpts = useMemo(() => [
    { value: '', label: 'All Categories' },
    ...categories.map(c => ({ value: String(c.id), label: c.name })),
  ], [categories])

  const erectorOpts = useMemo(() => [
    { value: '', label: 'All Erectors' },
    ...erectors.map(e => ({ value: String(e.id), label: e.shortName })),
  ], [erectors])

  const dispositionOpts = useMemo(() => [
    { value: '', label: 'All Dispositions' },
    ...DISPOSITIONS.map(d => ({ value: d.value, label: d.label })),
  ], [])

  return (
    <div className="mapping-toolbar">
      <div className="mapping-toolbar-left">
        <Filter size={14} />

        <CustomSelect
          options={categoryOpts}
          value={categoryFilter != null ? String(categoryFilter) : ''}
          onChange={v => onCategoryChange(v ? Number(v) : null)}
          placeholder="All Categories"
          className="mapping-filter-select"
        />

        <CustomSelect
          options={erectorOpts}
          value={erectorFilter != null ? String(erectorFilter) : ''}
          onChange={v => onErectorChange(v ? Number(v) : null)}
          placeholder="All Erectors"
          className="mapping-filter-select"
        />

        <CustomSelect
          options={dispositionOpts}
          value={dispositionFilter ?? ''}
          onChange={v => onDispositionChange((v || null) as Disposition | null)}
          placeholder="All Dispositions"
          className="mapping-filter-select"
        />
      </div>

      <div className="mapping-toolbar-right">
        <button
          className={`mapping-bulk-btn ${bulkMode ? 'active' : ''}`}
          onClick={onToggleBulk}
        >
          {bulkMode ? `Bulk Select (${bulkCount})` : 'Bulk Link'}
        </button>
      </div>
    </div>
  )
}
