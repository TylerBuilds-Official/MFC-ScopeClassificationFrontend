import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { ComparisonProgress } from '../../types/comparison'

import '../../styles/progress.css'


interface ComparisonProgressCardProps {
  progress: ComparisonProgress
}


const PHASES = ['Analyzing', 'Grouping', 'Complete'] as const

const PHASE_LABELS: Record<string, string> = {
  Pending:   'Starting up...',
  Analyzing: 'Extracting & classifying scope letters',
  Linking:   'Linking erector sessions...',
  Grouping:  'Grouping exclusions across erectors',
  Complete:  'Comparison complete',
  Error:     'Comparison failed',
}


function phaseIndex(phase: string): number {
  if (phase === 'Pending' || phase === 'Analyzing' || phase === 'Linking') return 0
  if (phase === 'Grouping') return 1
  if (phase === 'Complete') return 2

  return -1
}


export default function ComparisonProgressCard({ progress }: ComparisonProgressCardProps) {
  const { status, current_phase, erectors_analyzed, total_erectors, error_message } = progress

  const done   = status === 'Complete'
  const failed = status === 'Error'

  const currentIdx = phaseIndex(current_phase)

  // Build the subtitle
  let subtitle = PHASE_LABELS[current_phase] ?? 'Processing...'

  if (current_phase === 'Analyzing' && total_erectors > 0) {
    subtitle = `Analyzing erector ${erectors_analyzed + 1} of ${total_erectors}...`
  }

  if (current_phase === 'Linking') {
    subtitle = `Linking ${total_erectors} erectors for comparison...`
  }

  return (
    <div className={`progress-card ${done ? 'done' : ''} ${failed ? 'failed' : ''}`}>
      <div className="progress-card-header">
        <div className="progress-card-icon">
          {done   && <CheckCircle size={20} />}
          {failed && <XCircle size={20} />}
          {!done && !failed && <Loader2 size={20} className="spin" />}
        </div>
        <div>
          <div className="progress-card-title">
            {done ? 'Comparison Complete' : failed ? 'Comparison Failed' : 'Comparison Running'}
          </div>
          <div className="progress-card-subtitle">
            {subtitle}
          </div>
        </div>
      </div>

      {/* Phase pipeline */}
      <div className="progress-phases">
        {PHASES.map((phase, i) => {
          const isPast    = currentIdx > i
          const isCurrent = currentIdx === i
          const isFuture  = currentIdx < i && !failed

          let cls = 'phase-step'
          if (isPast)    cls += ' past'
          if (isCurrent) cls += ' current'
          if (isFuture)  cls += ' future'
          if (failed && !isPast && !isCurrent) cls += ' future'

          // Custom label for the Analyzing phase showing count
          let label: string = phase
          if (phase === 'Analyzing' && total_erectors > 0) {
            label = `Analyze (${done || isPast ? total_erectors : erectors_analyzed}/${total_erectors})`
          }

          return (
            <div key={phase} className={cls}>
              <div className="phase-dot">
                {isPast && <CheckCircle size={14} />}
                {isCurrent && !done && !failed && <Loader2 size={14} className="spin" />}
                {isCurrent && done && <CheckCircle size={14} />}
                {isCurrent && failed && <XCircle size={14} />}
              </div>
              <span className="phase-label">{label}</span>
              {i < PHASES.length - 1 && <div className={`phase-line ${isPast ? 'filled' : ''}`} />}
            </div>
          )
        })}
      </div>

      {/* Live stats */}
      {!failed && (
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="progress-stat-val">{done ? total_erectors : erectors_analyzed}</span>
            <span className="progress-stat-label">Erectors Analyzed</span>
          </div>
          <div className="progress-stat">
            <span className="progress-stat-val">{total_erectors}</span>
            <span className="progress-stat-label">Total Erectors</span>
          </div>
          {progress.total_unified > 0 && (
            <div className="progress-stat">
              <span className="progress-stat-val">{progress.total_unified}</span>
              <span className="progress-stat-label">Items Grouped</span>
            </div>
          )}
        </div>
      )}

      {/* Error detail */}
      {failed && error_message && (
        <div className="progress-error">{error_message}</div>
      )}
    </div>
  )
}
