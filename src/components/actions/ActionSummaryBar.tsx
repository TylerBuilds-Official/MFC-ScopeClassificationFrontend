import { AlertTriangle, Search, GitCompare, CheckCircle } from 'lucide-react'
import type { ActionItemSummary } from '../../types/actionItem'


interface ActionSummaryBarProps {
  summary: ActionItemSummary
}


export default function ActionSummaryBar({ summary }: ActionSummaryBarProps) {
  const highRisk     = summary.by_section.high_risk      ?? 0
  const erectorOnly  = summary.by_section.erector_only   ?? 0
  const partialReview = summary.by_section.partial_review ?? 0

  const resolved   = summary.addressed + summary.dismissed
  const progressPct = summary.total > 0
    ? Math.round((resolved / summary.total) * 100)
    : 0

  return (
    <div className="action-summary-bar">
      <div className="action-summary-stats">
        <div className="action-stat high-risk">
          <AlertTriangle size={14} />
          <span className="action-stat-value">{highRisk}</span>
          <span className="action-stat-label">Critical / High</span>
        </div>

        <div className="action-stat-divider" />

        <div className="action-stat erector-only">
          <Search size={14} />
          <span className="action-stat-value">{erectorOnly}</span>
          <span className="action-stat-label">Erector-Only</span>
        </div>

        <div className="action-stat-divider" />

        <div className="action-stat partial-review">
          <GitCompare size={14} />
          <span className="action-stat-value">{partialReview}</span>
          <span className="action-stat-label">Partial Review</span>
        </div>

        <div className="action-stat-divider" />

        <div className="action-stat resolved">
          <CheckCircle size={14} />
          <span className="action-stat-value">{resolved}</span>
          <span className="action-stat-label">
            of {summary.total} resolved
          </span>
        </div>
      </div>

      <div className="action-progress-track">
        <div
          className="action-progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
