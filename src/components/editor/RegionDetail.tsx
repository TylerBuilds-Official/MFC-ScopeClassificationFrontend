import { useState } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import type { EditorRegion } from '../../types/editor'


interface Props {
  region:      EditorRegion
  onClose:     () => void
  onValidate?: (matchId: number, matchType: string) => Promise<void>
}


export default function RegionDetail({ region, onClose, onValidate }: Props) {
  const [busy, setBusy] = useState<string | null>(null)

  const canValidate    = region.match_id != null && onValidate != null
  const isDeterministic = region.match_type === 'Deterministic'

  async function handleValidate(matchType: string) {
    if (!region.match_id || !onValidate) return
    if (matchType === region.match_type) return

    setBusy(matchType)
    try {
      await onValidate(region.match_id, matchType)
    } catch (err) {
      console.error('Validation failed:', err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="region-detail">
      <div className="region-detail-header">
        <span className={`region-detail-badge ${(region.match_type ?? 'unmatched').toLowerCase()}`}>
          {region.match_type ?? 'Unmatched'}
        </span>
        <button className="region-detail-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="region-detail-body">
        <div className="region-detail-row template">
          <label>MFC Template Text</label>
          <p>{region.snippet}</p>
        </div>

        {region.erector_text && (
          <div className="region-detail-row erector">
            <label>Erector Text</label>
            <p>{region.erector_text}</p>
          </div>
        )}

        {region.ai_reasoning && (
          <div className="region-detail-row reasoning">
            <label>AI Reasoning</label>
            <p>{region.ai_reasoning}</p>
          </div>
        )}

        {region.confidence !== null && (
          <div className="region-detail-row confidence">
            <label>Confidence:</label>
            <span className="region-detail-confidence-val">{Math.round(region.confidence * 100)}%</span>
          </div>
        )}
      </div>

      {/* Validate actions — always visible for non-deterministic matches */}
      {canValidate && !isDeterministic && (
        <div className="region-validate-actions">
          <span className="region-validate-label">Quick Validate</span>
          <div className="region-validate-btns">
            <button
              className={`region-validate-btn aligned ${region.match_type === 'Aligned' ? 'active' : ''} ${busy === 'Aligned' ? 'loading' : ''}`}
              disabled={busy !== null || region.match_type === 'Aligned'}
              onClick={() => handleValidate('Aligned')}
            >
              {busy === 'Aligned' ? <Loader2 size={13} className="validate-spinner" /> : <Check size={13} />}
              Aligned
            </button>
            <button
              className={`region-validate-btn partial ${region.match_type === 'Partial' ? 'active' : ''} ${busy === 'Partial' ? 'loading' : ''}`}
              disabled={busy !== null || region.match_type === 'Partial'}
              onClick={() => handleValidate('Partial')}
            >
              {busy === 'Partial' ? <Loader2 size={13} className="validate-spinner" /> : <Check size={13} />}
              Partial
            </button>
          </div>
        </div>
      )}

      {/* Deterministic banner — locked by Todd's mapping chain */}
      {isDeterministic && (
        <div className="region-validated-banner">
          <Check size={14} />
          <span>Deterministic</span>
        </div>
      )}
    </div>
  )
}
