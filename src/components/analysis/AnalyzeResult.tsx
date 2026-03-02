import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

import StatusBadge from '../../components/global/StatusBadge'
import type { AnalysisResult } from '../../types/analysis'


interface AnalyzeResultProps {
  result: AnalysisResult
}

function formatMethod(method: string): string {
  const normalized = method.toLowerCase().replace(/[_\-\s]/g, '')

  if (normalized.includes('ocr'))         return 'OCR'
  if (normalized.includes('textextract')) return 'Text Extraction'

  return method
}


export default function AnalyzeResult({ result }: AnalyzeResultProps) {
  const navigate = useNavigate()

  const isOk    = result.status === 'Complete'
  const isError = result.status === 'Error'

  const Icon = isError ? XCircle : isOk ? CheckCircle : AlertTriangle
  const iconColor = isError
    ? 'var(--status-error)'
    : isOk
      ? 'var(--status-complete)'
      : 'var(--status-running)'

  return (
    <div className="analyze-result">
      <div className="result-header">
        <Icon size={22} style={{ color: iconColor, flexShrink: 0 }} />
        <h3>Analysis {result.status}</h3>
        <StatusBadge status={result.status} />
      </div>

      {result.error_message && (
        <div
          style={{
            padding:      '10px 14px',
            marginBottom: 16,
            background:   'rgba(248, 113, 113, 0.08)',
            border:       '1px solid rgba(248, 113, 113, 0.2)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--status-error)',
            fontSize:     '13px',
          }}
        >
          {result.error_message}
        </div>
      )}

      <div className="result-stats">
        {result.extraction && (
          <>
            <StatTile label="Items Extracted" value={result.extraction.total_items} />
            <StatTile label="Sections Found"  value={result.extraction.total_sections} />
            <StatTile label="Method"          value={formatMethod(result.extraction.method)} />
          </>
        )}
        {result.comparison && (
          <>
            <StatTile label="Aligned"      value={result.comparison.total_aligned} />
            <StatTile label="Partial"       value={result.comparison.total_partial} />
            <StatTile label="Erector Only"  value={result.comparison.total_erector_only} />
            <StatTile label="MFC Only"      value={result.comparison.total_mfc_only} />
            <StatTile label="Avg Confidence" value={`${Math.round(result.comparison.avg_confidence * 100)}%`} />
          </>
        )}
        <StatTile label="High Risk Items" value={result.high_risk_items.length} />
        <StatTile label="Total Time"      value={`${(result.processing_time_ms / 1000).toFixed(1)}s`} />
      </div>

      <button
        className="btn-analyze"
        style={{ marginTop: 20 }}
        onClick={() => navigate(`/sessions/${result.session_id}`)}
      >
        View Full Session →
      </button>
    </div>
  )
}


function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}
