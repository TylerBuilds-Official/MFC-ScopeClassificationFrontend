import { useState, useCallback } from 'react'
import { Plus, Check, X } from 'lucide-react'

import { updateSession } from '../../api/sessions'
import type { MatchSummary } from '../../types/session'


interface SessionSummaryCardProps {
  session:      Record<string, unknown>
  matchSummary: MatchSummary
  onUpdated?:   () => void
}


export default function SessionSummaryCard({ session, matchSummary, onUpdated }: SessionSummaryCardProps) {
  const total = matchSummary.Aligned + matchSummary.Partial
    + matchSummary.ErectorOnly + matchSummary.MfcOnly
    + (matchSummary.Deterministic ?? 0)

  const sessionId = session.Id as number

  return (
    <>
      {/* Info row */}
      <div className="session-detail-grid">
        <EditableInfoCard
          label="Erector"
          value={str(session.ErectorNameRaw)}
          field="erector_name_raw"
          sessionId={sessionId}
          onUpdated={onUpdated}
        />
        <EditableInfoCard
          label="Job #"
          value={str(session.JobNumber)}
          field="job_number"
          sessionId={sessionId}
          onUpdated={onUpdated}
        />
        <InfoCard label="Source File"  value={str(session.SourceFileName)} />
        <InfoCard label="Status"      value={str(session.Status)} />
        <InfoCard label="Method"      value={formatMethod(str(session.ExtractionMethod))} />
        <InfoCard label="Extracted"   value={str(session.TotalExtracted)} />
      </div>

      {/* Match counts */}
      <div className="session-detail-grid">
        <StatCard label="Aligned"        value={matchSummary.Aligned}                cls="aligned" />
        <StatCard label="Deterministic"  value={matchSummary.Deterministic ?? 0}     cls="deterministic" />
        <StatCard label="Partial"        value={matchSummary.Partial}                cls="partial" />
        <StatCard label="Erector Only"   value={matchSummary.ErectorOnly}            cls="erector-only" />
        <StatCard label="MFC Only"       value={matchSummary.MfcOnly}                cls="mfc-only" />
        <StatCard label="Total Matches"  value={total}                               cls="" />
      </div>
    </>
  )
}


/* ── Editable Info Card ──────────────────────────────────────────── */

interface EditableInfoCardProps {
  label:     string
  value:     string
  field:     string
  sessionId: number
  onUpdated?: () => void
}

function EditableInfoCard({ label, value, field, sessionId, onUpdated }: EditableInfoCardProps) {
  const isEmpty = value === '—'

  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const [busy, setBusy]       = useState(false)

  function startEdit() {
    setDraft(isEmpty ? '' : value)
    setEditing(true)
  }

  const save = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    setBusy(true)
    try {
      await updateSession(sessionId, { [field]: trimmed })
      setEditing(false)
      onUpdated?.()
    } finally {
      setBusy(false)
    }
  }, [draft, sessionId, field, onUpdated])

  if (editing) {
    return (
      <div className="stat-card">
        <div className="stat-label">{label}</div>
        <div className="inline-edit-row">
          <input
            className="inline-edit-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus
            disabled={busy}
          />
          <button className="inline-edit-btn save" onClick={save} disabled={!draft.trim() || busy}>
            <Check size={13} />
          </button>
          <button className="inline-edit-btn cancel" onClick={() => setEditing(false)} disabled={busy}>
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="editable-value">
        {isEmpty ? (
          <button className="inline-add-btn" onClick={startEdit}>
            <Plus size={13} /> Set {label}
          </button>
        ) : (
          <span
            className="editable-text"
            onClick={startEdit}
            title={`Click to edit ${label}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  )
}


/* ── Static cards ────────────────────────────────────────────────── */

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 500 }}>
        {value}
      </div>
    </div>
  )
}


function StatCard({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${cls}`}>{value}</div>
    </div>
  )
}


function str(val: unknown): string {
  if (val == null) return '—'

  return String(val)
}


function formatMethod(method: string): string {
  const normalized = method.toLowerCase().replace(/[_\-\s]/g, '')

  if (normalized.includes('ocr'))         return 'OCR'
  if (normalized.includes('textextract')) return 'Text Extraction'

  return method
}
