import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

import { useApi } from '../../hooks/useApi'
import { getMfcExclusions } from '../../api/exclusions'
import type { MfcExclusion } from '../../types/exclusion'


export default function ContractualReviewPanel() {
  const [expanded, setExpanded] = useState(false)

  const { data, loading } = useApi(
    () => getMfcExclusions(undefined, 'Contractual'),
    [],
  )

  const items: MfcExclusion[] = data?.exclusions ?? []

  if (loading || items.length === 0) return null

  return (
    <div className="contractual-panel">
      <div
        className="contractual-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="contractual-header-left">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <FileText size={14} />
          <span>Contractual Review Items</span>
        </div>
        <span className="contractual-count">{items.length}</span>
      </div>

      {expanded && (
        <div className="contractual-body">
          <p className="contractual-hint">
            These contractual terms apply to every bid and should be verified during scope review.
          </p>
          {items.map(item => (
            <div key={item.Id} className="contractual-item">
              <span className="contractual-id">#{item.Id}</span>
              <span className="contractual-text">{item.Exclusion}</span>
              {item.Notes && (
                <span className="contractual-notes">{item.Notes}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
