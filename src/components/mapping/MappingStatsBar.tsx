import { useRef } from 'react'
import type { MappingStats } from '../../types/mapping'


interface Props {
  stats:   MappingStats | null
  loading: boolean
}


/**
 * Progress bar + per-erector breakdown.
 * Caches last known stats so layout never collapses during refetch.
 */
export default function MappingStatsBar({ stats, loading }: Props) {
  const cached = useRef<MappingStats | null>(null)

  if (stats) cached.current = stats

  const display  = cached.current
  const fading   = loading || !stats

  const unmapped = display?.by_disposition['Unmapped'] ?? 0
  const total    = display?.total ?? 0
  const resolved = total - unmapped

  return (
    <div className={`mapping-stats-bar ${fading ? 'stats-fading' : ''}`}>
      <div className="mapping-stats-summary">
        <div className="mapping-stat">
          <span className="mapping-stat-value">{resolved}</span>
          <span className="mapping-stat-label">Resolved</span>
        </div>
        <div className="mapping-stat">
          <span className="mapping-stat-value unmapped">{unmapped}</span>
          <span className="mapping-stat-label">Unmapped</span>
        </div>
        <div className="mapping-stat">
          <span className="mapping-stat-value">{total}</span>
          <span className="mapping-stat-label">Total</span>
        </div>
      </div>

      <div className="mapping-stats-progress">
        <div
          className="mapping-stats-progress-fill"
          style={{ width: `${total ? (resolved / total) * 100 : 0}%` }}
        />
      </div>

      <div className="mapping-stats-erectors">
        {Object.entries(display?.by_erector ?? {}).map(([name, counts]) => {
          const erectorResolved = (counts.Mapped ?? 0) + (counts.PMReportOnly ?? 0)
          const erectorTotal    = counts.total ?? 0

          return (
            <div key={name} className="mapping-erector-stat">
              <span className="mapping-erector-name">{name}</span>
              <span className="mapping-erector-count">
                {erectorResolved} / {erectorTotal}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
