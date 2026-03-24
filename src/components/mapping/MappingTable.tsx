import MappingRow from './MappingRow'
import type { AtomicExclusionItem, MfcOption } from '../../types/mapping'


interface Props {
  items:         AtomicExclusionItem[]
  mfcOptions:    MfcOption[]
  bulkMode:      boolean
  bulkSelected:  Set<number>
  onToggleBulk:  (id: number) => void
  onLinkCreated: () => void
  onDispositionChanged: () => void
  onErectorClick: (id: number) => void
}


export default function MappingTable({
    items, mfcOptions,
    bulkMode, bulkSelected, onToggleBulk,
    onLinkCreated, onDispositionChanged, onErectorClick }: Props) {

  if (items.length === 0) {
    return (
      <div className="mapping-empty">
        No exclusions found matching the current filters.
      </div>
    )
  }

  return (
    <div className="mapping-table-wrapper">
      <table className="mapping-table">
        <thead>
          <tr>
            <th className={`mapping-col-check ${bulkMode ? 'visible' : ''}`} />
            <th className="mapping-col-erector">Sources</th>
            <th className="mapping-col-exclusion">Exclusion</th>
            <th className="mapping-col-disposition">Status</th>
            <th className="mapping-col-mappings">Mapped To</th>
            <th className="mapping-col-notes">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <MappingRow
              key={item.Id}
              item={item}
              mfcOptions={mfcOptions}
              bulkMode={bulkMode}
              bulkSelected={bulkSelected.has(item.Id)}
              onToggleBulk={() => onToggleBulk(item.Id)}
              onLinkCreated={onLinkCreated}
              onDispositionChanged={onDispositionChanged}
              onErectorClick={onErectorClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
