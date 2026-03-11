import { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'

import { useApi } from '../../hooks/useApi'
import { getMfcExclusions } from '../../api/exclusions'
import type { MfcExclusion } from '../../types/exclusion'


export default function ContractualReviewPanel() {
  const [expanded, setExpanded]   = useState(false)
  const [reviewed, setReviewed]   = useState<Set<number>>(new Set())

  const { data, loading } = useApi(
    () => getMfcExclusions(undefined, 'Contractual'),
    [],
  )

  const items: MfcExclusion[] = data?.exclusions ?? []

  if (loading || items.length === 0) return null

  function toggleReviewed(id: number) {
    setReviewed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)

      return next
    })
  }

  const reviewedCount = reviewed.size
  const allReviewed   = reviewedCount === items.length

  if (!expanded) {
    return (
      <button className="contractual-trigger" onClick={() => setExpanded(true)}>
        <ChevronRight size={13} />
        <span>Review Contractual Items</span>
        <span className={`contractual-trigger-count ${allReviewed ? 'complete' : ''}`}>
          {reviewedCount > 0 ? `${reviewedCount} / ${items.length}` : items.length}
        </span>
      </button>
    )
  }

  return (
    <div className="contractual-panel">
      <div className="contractual-header" onClick={() => setExpanded(false)}>
        <span>Contractual Review Items</span>
        {reviewedCount > 0 && (
          <span className={`contractual-progress ${allReviewed ? 'complete' : ''}`}>
            {reviewedCount} / {items.length}
          </span>
        )}
      </div>

      {items.map(item => {
        const isReviewed = reviewed.has(item.Id)

        return (
          <div
            key={item.Id}
            className={`contractual-item ${isReviewed ? 'reviewed' : ''}`}
          >
            <button
              className={`contractual-check ${isReviewed ? 'checked' : ''}`}
              onClick={() => toggleReviewed(item.Id)}
              title={isReviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
            >
              {isReviewed && <Check size={12} />}
            </button>
            <span className="contractual-id">#{item.Id}</span>
            <span className="contractual-text">{item.Exclusion}</span>
            {item.Notes && (
              <span className="contractual-notes">{item.Notes}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
