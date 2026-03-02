import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { SessionProgress } from '../../types/session'

import '../../styles/progress.css'


interface ProgressCardProps {
  progress: SessionProgress
}


const PHASES = ['Ingested', 'Extracted', 'Classified', 'Complete'] as const

const PHASE_DESCRIPTIONS: Record<string, string> = {
  Ingested:   'Extracting exclusions from PDF...',
  Extracted:  'Classifying items into categories...',
  Classified: 'Comparing against MFC baseline...',
  Complete:   'Analysis complete',
  Error:      'Pipeline encountered an error',
}


export default function ProgressCard({ progress }: ProgressCardProps) {
  const { status, is_active, error_message } = progress
  const done   = status === 'Complete'
  const failed = status === 'Error'

  const currentIndex = PHASES.indexOf(status as typeof PHASES[number])

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
            {done ? 'Analysis Complete' : failed ? 'Analysis Failed' : 'Analysis Running'}
          </div>
          <div className="progress-card-subtitle">
            {PHASE_DESCRIPTIONS[status] ?? 'Processing...'}
          </div>
        </div>
      </div>

      {/* Phase pipeline */}
      <div className="progress-phases">
        {PHASES.map((phase, i) => {
          const isPast    = currentIndex > i
          const isCurrent = status === phase
          const isFuture  = currentIndex < i && !failed

          let cls = 'phase-step'
          if (isPast)    cls += ' past'
          if (isCurrent) cls += ' current'
          if (isFuture)  cls += ' future'
          if (failed && !isPast && !isCurrent) cls += ' future'

          return (
            <div key={phase} className={cls}>
              <div className="phase-dot">
                {isPast && <CheckCircle size={14} />}
                {isCurrent && !done && !failed && <Loader2 size={14} className="spin" />}
                {isCurrent && done && <CheckCircle size={14} />}
                {isCurrent && failed && <XCircle size={14} />}
              </div>
              <span className="phase-label">{phase}</span>
              {i < PHASES.length - 1 && <div className={`phase-line ${isPast ? 'filled' : ''}`} />}
            </div>
          )
        })}
      </div>

      {/* Live stats */}
      {!failed && (progress.total_extracted != null || progress.total_classified != null) && (
        <div className="progress-stats">
          {progress.total_extracted != null && (
            <div className="progress-stat">
              <span className="progress-stat-val">{progress.total_extracted}</span>
              <span className="progress-stat-label">Extracted</span>
            </div>
          )}
          {progress.total_classified != null && (
            <div className="progress-stat">
              <span className="progress-stat-val">{progress.total_classified}</span>
              <span className="progress-stat-label">Classified</span>
            </div>
          )}
          {progress.total_aligned != null && (
            <div className="progress-stat">
              <span className="progress-stat-val aligned">{progress.total_aligned}</span>
              <span className="progress-stat-label">Aligned</span>
            </div>
          )}
          {progress.total_erector_only != null && (
            <div className="progress-stat">
              <span className="progress-stat-val erector-only">{progress.total_erector_only}</span>
              <span className="progress-stat-label">Erector Only</span>
            </div>
          )}
          {progress.total_mfc_only != null && (
            <div className="progress-stat">
              <span className="progress-stat-val mfc-only">{progress.total_mfc_only}</span>
              <span className="progress-stat-label">MFC Only</span>
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
