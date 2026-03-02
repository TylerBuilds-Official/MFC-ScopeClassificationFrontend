import type { HeatmapCell } from '../../types/category'


const MATCH_TYPES = ['Aligned', 'Partial', 'ErectorOnly', 'MfcOnly'] as const


interface HeatmapGridProps {
  data: HeatmapCell[]
}


export default function HeatmapGrid({ data }: HeatmapGridProps) {
  // Pivot: { categoryId → { categoryName, Aligned: n, Partial: n, ... } }
  const rows = buildRows(data)
  const maxVal = Math.max(1, ...data.map(d => d.cnt))

  return (
    <div className="heatmap-container">
      <table className="heatmap-grid">
        <thead>
          <tr>
            <th>Category</th>
            {MATCH_TYPES.map(t => (
              <th key={t}>{formatType(t)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.categoryId}>
              <td>{row.categoryName}</td>
              {MATCH_TYPES.map(t => {
                const val       = row.counts[t] ?? 0
                const intensity = intensityLevel(val, maxVal)

                return (
                  <td key={t} className={`heatmap-cell intensity-${intensity}`}>
                    {val}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`legend-swatch heatmap-cell intensity-${i}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}


interface PivotRow {
  categoryId:   number
  categoryName: string
  counts:       Record<string, number>
}


function buildRows(data: HeatmapCell[]): PivotRow[] {
  const map = new Map<number, PivotRow>()

  for (const cell of data) {
    if (!map.has(cell.category_id)) {
      map.set(cell.category_id, {
        categoryId:   cell.category_id,
        categoryName: cell.category_name,
        counts:       {},
      })
    }

    map.get(cell.category_id)!.counts[cell.MatchType] = cell.cnt
  }

  return Array.from(map.values()).sort((a, b) => a.categoryId - b.categoryId)
}


function intensityLevel(val: number, max: number): number {
  if (val === 0) return 0

  const ratio = val / max
  if (ratio <= 0.1) return 1
  if (ratio <= 0.25) return 2
  if (ratio <= 0.5) return 3
  if (ratio <= 0.75) return 4

  return 5
}


function formatType(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').trim()
}
