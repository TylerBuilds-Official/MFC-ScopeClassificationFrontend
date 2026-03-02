import { useNavigate } from 'react-router-dom'
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useRunningSessions } from '../../hooks/useRunningSessions'

import '../../styles/toast.css'


const PHASE_LABELS: Record<string, string> = {
  Ingested:   'Extracting...',
  Extracted:  'Classifying...',
  Classified: 'Comparing...',
  Complete:   'Complete',
  Error:      'Failed',
}


export default function ProgressToast() {
  const { sessions, dismiss } = useRunningSessions()
  const navigate               = useNavigate()

  const visible = sessions.filter(s => !s.dismissed)
  if (visible.length === 0) return null

  return (
    <div className="toast-stack">
      {visible.map(({ sessionId, progress }) => {
        const status = progress?.status ?? 'Ingested'
        const done   = status === 'Complete'
        const error  = status === 'Error'
        const label  = PHASE_LABELS[status] ?? 'Processing...'
        const name   = progress?.erector_name_raw ?? `Session #${sessionId}`

        return (
          <div
            key={sessionId}
            className={`toast-item ${done ? 'complete' : ''} ${error ? 'error' : ''}`}
            onClick={() => navigate(`/sessions/${sessionId}`)}
          >
            <div className="toast-icon">
              {done  && <CheckCircle size={18} />}
              {error && <XCircle size={18} />}
              {!done && !error && <Loader2 size={18} className="spin" />}
            </div>

            <div className="toast-body">
              <div className="toast-title">{name}</div>
              <div className="toast-status">{label}</div>
            </div>

            <button
              className="toast-close"
              onClick={e => { e.stopPropagation(); dismiss(sessionId) }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
