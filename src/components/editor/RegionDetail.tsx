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
    </div>
  )
}
