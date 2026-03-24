import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import MfcLinkDropdown from './MfcLinkDropdown'
import { bulkLink } from '../../api/mapping'
import type { MfcOption, AtomicExclusionItem } from '../../types/mapping'


interface Props {
  selectedIds:   Set<number>
  items:         AtomicExclusionItem[]
  mfcOptions:    MfcOption[]
  onComplete:    () => void
  onClearSelection: () => void
}


export default function BulkLinkPanel({
    selectedIds, items, mfcOptions,
    onComplete, onClearSelection }: Props) {

  const [showDropdown, setShowDropdown] = useState(false)
  const [busy, setBusy]                 = useState(false)
  const [result, setResult]             = useState<string | null>(null)

  const selected = items.filter(i => selectedIds.has(i.Id))

  async function handleBulkLink(mfcId: number) {
    setBusy(true)
    setResult(null)

    try {
      const res = await bulkLink(Array.from(selectedIds), mfcId)

      setResult(
        `Linked ${res.links_created} items` +
        (res.links_skipped > 0 ? ` (${res.links_skipped} already linked)` : '')
      )
      setShowDropdown(false)
      onComplete()
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    } finally {
      setBusy(false)
    }
  }

  if (selectedIds.size === 0) {
    return (
      <div className="bulk-link-panel">
        <div className="bulk-link-empty">
          <Link2 size={16} />
          Select exclusions from the table to bulk-link them to one MFC item.
        </div>
      </div>
    )
  }

  return (
    <div className="bulk-link-panel">
      <div className="bulk-link-header">
        <h4>{selectedIds.size} items selected</h4>
        <button className="bulk-link-clear" onClick={onClearSelection}>
          <X size={14} /> Clear
        </button>
      </div>

      <div className="bulk-link-selected">
        {selected.map(item => (
          <div key={item.Id} className="bulk-link-chip">
            <span className="bulk-link-chip-erector">
              {item.sources.map(s => s.erector_short_name).join(', ')}
            </span>
            <span className="bulk-link-chip-text">{item.Exclusion}</span>
          </div>
        ))}
      </div>

      <div className="bulk-link-action">
        <button
          className="mapping-bulk-action-btn"
          onClick={() => setShowDropdown(true)}
          disabled={busy}
        >
          <Link2 size={14} />
          Map All to MFC Exclusion
        </button>

        {showDropdown && (
          <MfcLinkDropdown
            options={mfcOptions}
            existingMfcIds={[]}
            onSelect={handleBulkLink}
            onClose={() => setShowDropdown(false)}
          />
        )}

        {result && <span className="bulk-link-result">{result}</span>}
      </div>
    </div>
  )
}
