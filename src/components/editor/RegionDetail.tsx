import { X } from 'lucide-react'
import type { EditorRegion } from '../../types/editor'


interface Props {
  region:  EditorRegion
  onClose: () => void
}


export default function RegionDetail({ region, onClose }: Props) {

  return (
    <div className="region-detail">
      <div className="region-detail-header">
        <span className={`region-detail-badge ${(region.match_type ?? 'unmatched').toLowerCase()}`}>
          {region.match_type ?? 'Unmatched'}
        </span>
        {region.risk_level && (
          <span className={`region-detail-risk ${region.risk_level.toLowerCase()}`}>
            {region.risk_level}
          </span>
        )}
        <button className="region-detail-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="region-detail-body">
        <div className="region-detail-row">
          <label>Template Text</label>
          <p>{region.snippet}</p>
        </div>

        {region.erector_text && (
          <div className="region-detail-row">
            <label>Erector Text</label>
            <p>{region.erector_text}</p>
          </div>
        )}

        {region.ai_reasoning && (
          <div className="region-detail-row">
            <label>AI Reasoning</label>
            <p>{region.ai_reasoning}</p>
          </div>
        )}

        {region.risk_notes && (
          <div className="region-detail-row">
            <label>Risk Notes</label>
            <p>{region.risk_notes}</p>
          </div>
        )}

        {region.confidence !== null && (
          <div className="region-detail-row">
            <label>Confidence</label>
            <p>{Math.round(region.confidence * 100)}%</p>
          </div>
        )}
      </div>
    </div>
  )
}
