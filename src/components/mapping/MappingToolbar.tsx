import { useMemo } from 'react'
import { Filter, Plus } from 'lucide-react'
import CustomSelect from '../global/CustomSelect'
import type { Disposition, ErectorOption } from '../../types/mapping'


interface Props {
  erectors:        ErectorOption[]
  erectorFilter:   number | null
  dispositionFilter: Disposition | null
  onErectorChange:     (id: number | null) => void
  onDispositionChange: (d: Disposition | null) => void
  bulkMode:        boolean
  onToggleBulk:    () => void
  bulkCount:       number
  onAddExclusion:  () => void
}


const DISPOSITIONS: { value: Disposition; label: string }[] = [
  { value: 'Unmapped',     label: 'Unmapped' },
  { value: 'Mapped',       label: 'Mapped' },
  { value: 'PMReportOnly', label: 'PM Report' },
]


export default function MappingToolbar({
    erectors,
    erectorFilter, dispositionFilter,
    onErectorChange, onDispositionChange,
    bulkMode, onToggleBulk, bulkCount, onAddExclusion }: Props) {

  const erectorOpts = useMemo(() => [
    { value: '', label: 'All Erectors' },
    ...erectors.map(e => ({ value: String(e.Id), label: e.ShortName })),
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
        <button className="mapping-add-btn" onClick={onAddExclusion}>
          <Plus size={14} />
          Add Exclusion
        </button>

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
