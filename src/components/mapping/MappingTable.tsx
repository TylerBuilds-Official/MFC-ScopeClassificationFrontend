import { useMemo } from 'react'
import MappingRow from './MappingRow'
import type { ErectorExclusionItem, MfcOption } from '../../types/mapping'


interface Props {
  items:         ErectorExclusionItem[]
  mfcOptions:    MfcOption[]
  bulkMode:      boolean
  bulkSelected:  Set<number>
  onToggleBulk:  (id: number) => void
  onLinkCreated: () => void
  onDispositionChanged: () => void
  onErectorClick: (id: number) => void
}


/**
 * Category-grouped table of erector exclusions.
 * Each category gets a header row, then individual MappingRow entries underneath.
 */
export default function MappingTable({
    items, mfcOptions,
    bulkMode, bulkSelected, onToggleBulk,
    onLinkCreated, onDispositionChanged, onErectorClick }: Props) {

  // Group items by CategoryName
  const grouped = useMemo(() => {
    const map = new Map<string, ErectorExclusionItem[]>()

    for (const item of items) {
      const key = item.CategoryName
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }

    return Array.from(map.entries())
  }, [items])

  if (items.length === 0) {
    return (
      <div className="mapping-empty">
        No erector exclusions found matching the current filters.
      </div>
    )
  }

  return (
    <div className="mapping-table-wrapper">
      <table className="mapping-table">
        <thead>
          <tr>
            <th className={`mapping-col-check ${bulkMode ? 'visible' : ''}`} />
            <th className="mapping-col-erector">Erector</th>
            <th className="mapping-col-exclusion">Exclusion</th>
            <th className="mapping-col-disposition">Status</th>
            <th className="mapping-col-mappings">Mapped To</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([category, categoryItems]) => (
            <CategoryGroup
              key={category}
              category={category}
              items={categoryItems}
              mfcOptions={mfcOptions}
              bulkMode={bulkMode}
              bulkSelected={bulkSelected}
              onToggleBulk={onToggleBulk}
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


function CategoryGroup({
    category, items, mfcOptions,
    bulkMode, bulkSelected, onToggleBulk,
    onLinkCreated, onDispositionChanged, onErectorClick }: {
  category:      string
  items:         ErectorExclusionItem[]
  mfcOptions:    MfcOption[]
  bulkMode:      boolean
  bulkSelected:  Set<number>
  onToggleBulk:  (id: number) => void
  onLinkCreated: () => void
  onDispositionChanged: () => void
  onErectorClick: (id: number) => void
}) {

  return (
    <>
      <tr className="mapping-category-row">
        <td colSpan={5}>
          {category}
          <span className="mapping-category-count">{items.length}</span>
        </td>
      </tr>

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
          onErectorClick={() => onErectorClick(item.ErectorId)}
        />
      ))}
    </>
  )
}
