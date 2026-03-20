import { useState, useRef, useEffect } from 'react'
import { X, Link, Check, StickyNote } from 'lucide-react'
import MfcLinkDropdown from './MfcLinkDropdown'
import { createLink, deleteLink, updateDisposition, updateNotes } from '../../api/mapping'
import type { ErectorExclusionItem, MfcOption, Disposition } from '../../types/mapping'


interface Props {
  item:           ErectorExclusionItem
  mfcOptions:     MfcOption[]
  bulkMode:       boolean
  bulkSelected:   boolean
  onToggleBulk:   () => void
  onLinkCreated:  () => void
  onDispositionChanged: () => void
  onErectorClick: () => void
}


const DISPOSITION_LABELS: Record<string, { label: string; className: string }> = {
  Unmapped:     { label: 'Unmapped',   className: 'disp-unmapped' },
  Mapped:       { label: 'Mapped',     className: 'disp-mapped' },
  PMReportOnly: { label: 'PM Report',  className: 'disp-pm' },
}


/**
 * Single erector exclusion row.
 * Shows: erector badge, exclusion text, disposition pill, linked MFC items, actions.
 */
export default function MappingRow({
    item, mfcOptions,
    bulkMode, bulkSelected, onToggleBulk,
    onLinkCreated, onDispositionChanged, onErectorClick }: Props) {

  const [showLinkDropdown, setShowLinkDropdown] = useState(false)
  const [showDispMenu, setShowDispMenu]         = useState(false)
  const [busy, setBusy]                         = useState(false)
  const [pillFading, setPillFading]              = useState(false)
  const [removingLinkId, setRemovingLinkId]     = useState<number | null>(null)
  const [editingNotes, setEditingNotes]         = useState(false)
  const [localNotes, setLocalNotes]             = useState(item.Notes ?? '')
  const notesRef                                 = useRef<HTMLTextAreaElement>(null)
  const prevDisp                                 = useRef(item.Disposition)
  const prevMappingIds                           = useRef<Set<number>>(new Set(item.mappings.map(m => m.link_id)))
  const newLinkIds                               = useRef<Set<number>>(new Set())

  // Track which links are newly added since last render
  useEffect(() => {
    const currentIds = new Set(item.mappings.map(m => m.link_id))
    const fresh      = new Set<number>()

    for (const id of currentIds) {
      if (!prevMappingIds.current.has(id)) fresh.add(id)
    }

    newLinkIds.current      = fresh
    prevMappingIds.current  = currentIds
  }, [item.mappings])

  const disp = DISPOSITION_LABELS[item.Disposition] ?? DISPOSITION_LABELS.Unmapped

  // Fade pill back in after any data refresh (disposition change OR new link added)
  useEffect(() => {
    if (!pillFading) return

    if (item.Disposition !== prevDisp.current) {
      prevDisp.current = item.Disposition
    }

    // Render one frame at opacity 0 with new class, then remove fading to trigger transition
    requestAnimationFrame(() => setPillFading(false))
  }, [item.Disposition, item.mappings])

  async function handleCreateLink(mfcId: number) {
    setBusy(true)
    setPillFading(true)

    try {
      await createLink(item.Id, mfcId)
      setShowLinkDropdown(false)
      onLinkCreated()
    } catch (err) {
      console.error('Failed to create link:', err)
    } finally {
      setBusy(false)
    }
  }

  function handleRemoveLink(linkId: number) {
    setRemovingLinkId(linkId)

    // Let the fade-out animation play, then fire the actual delete
    setTimeout(async () => {
      setBusy(true)

      try {
        await deleteLink(linkId)
        onLinkCreated()
      } catch (err) {
        console.error('Failed to delete link:', err)
      } finally {
        setRemovingLinkId(null)
        setBusy(false)
      }
    }, 150)
  }

  function handleDispClick(d: Disposition) {
    setShowDispMenu(false)

    if (d === 'Mapped') {
      // "Mapped" means pick an MFC exclusion — backend auto-sets disposition on link creation
      setShowLinkDropdown(true)

      return
    }

    setPillFading(true)
    handleDisposition(d)
  }

  async function handleNotesSave() {
    setEditingNotes(false)

    const trimmed = localNotes.trim() || null
    if (trimmed === (item.Notes ?? null)) return

    try {
      await updateNotes(item.Id, trimmed)
      setLocalNotes(trimmed ?? '')
    } catch (err) {
      console.error('Failed to save notes:', err)
      setLocalNotes(item.Notes ?? '')
    }
  }

  async function handleDisposition(d: Disposition) {
    setBusy(true)

    try {
      await updateDisposition(item.Id, d)
      onDispositionChanged()
    } catch (err) {
      console.error('Failed to update disposition:', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className={`mapping-row ${bulkSelected ? 'bulk-selected' : ''}`}>
      <td className={`mapping-col-check ${bulkMode ? 'visible' : ''}`}>
        {bulkMode && (
          <button
            className={`mapping-check ${bulkSelected ? 'checked' : ''}`}
            onClick={onToggleBulk}
          >
            <Check size={12} strokeWidth={3} />
          </button>
        )}
      </td>

      <td className="mapping-col-erector">
        <span className="erector-badge clickable" onClick={onErectorClick}>
          {item.ErectorShortName}
        </span>
      </td>

      <td className="mapping-col-exclusion">
        <span className="mapping-exclusion-text">{item.Exclusion}</span>
      </td>

      <td className="mapping-col-disposition">
        <div className="disp-wrapper">
          <button
            className={`disp-pill ${disp.className} ${pillFading ? 'fading' : ''}`}
            onClick={() => setShowDispMenu(!showDispMenu)}
            disabled={busy}
          >
            {disp.label}
          </button>

          {showDispMenu && (
            <div className="disp-menu">
              {Object.entries(DISPOSITION_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  className={`disp-menu-item ${item.Disposition === key ? 'active' : ''}`}
                  onClick={() => handleDispClick(key as Disposition)}
                >
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      <td className="mapping-col-mappings">
        <div className="mapping-links">
          {item.mappings.map(m => (
            <span
              key={m.link_id}
              className={[
                'mapping-link-chip',
                newLinkIds.current.has(m.link_id) ? 'entering' : '',
                removingLinkId === m.link_id       ? 'removing' : '',
              ].join(' ')}
            >
              <span className="mapping-link-text" title={m.mfc_exclusion}>
                {m.mfc_exclusion}
              </span>
              <button
                className="mapping-link-remove"
                onClick={() => handleRemoveLink(m.link_id)}
                disabled={busy || removingLinkId === m.link_id}
                title="Remove link"
              >
                <X size={10} />
              </button>
            </span>
          ))}

          <button
            className="mapping-add-link-btn"
            onClick={() => setShowLinkDropdown(!showLinkDropdown)}
            disabled={busy}
            title="Link to MFC exclusion"
          >
            <Link size={11} />
            Map
          </button>
        </div>

        {showLinkDropdown && (
          <MfcLinkDropdown
            options={mfcOptions}
            existingMfcIds={item.mappings.map(m => m.mfc_exclusion_id)}
            defaultCategoryId={item.CategoryId}
            onSelect={handleCreateLink}
            onClose={() => setShowLinkDropdown(false)}
          />
        )}
      </td>

      <td className="mapping-col-notes">
        <div className="mapping-notes-cell">
          {editingNotes ? (
            <textarea
              ref={notesRef}
              className="mapping-notes-editor"
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onBlur={handleNotesSave}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setLocalNotes(item.Notes ?? '')
                  setEditingNotes(false)
                }
              }}
              rows={3}
              placeholder="Add a note..."
              maxLength={500}
            />
          ) : (
            <>
              {localNotes && (
                <span className="mapping-notes-preview" title={localNotes}>
                  {localNotes}
                </span>
              )}
              <button
                className={`mapping-notes-btn ${localNotes ? 'has-notes' : ''}`}
                onClick={() => {
                  setEditingNotes(true)
                  requestAnimationFrame(() => notesRef.current?.focus())
                }}
                title={localNotes ? 'Edit note' : 'Add note'}
              >
                <StickyNote size={13} />
              </button>
            </>
          )}
        </div>
      </td>

    </tr>
  )
}
