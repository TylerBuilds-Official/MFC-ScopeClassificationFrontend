import { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'

import ActionSummaryBar from './ActionSummaryBar'
import ActionItemRow from './ActionItemRow'
import ContractualReviewPanel from '../matches/ContractualReviewPanel'
import LoadingSpinner from '../global/LoadingSpinner'
import EmptyState from '../global/EmptyState'
import CustomSelect from '../global/CustomSelect'
import ConfirmDialog from '../global/ConfirmDialog'
import { useApi } from '../../hooks/useApi'
import { useCategories } from '../../hooks/useCategories'
import {
  getSessionActionItems,
  updateActionItem,
  generateActionItems,
} from '../../api/actionItems'
import { createMfcExclusion } from '../../api/exclusions'
import type { ActionItem } from '../../types/actionItem'


interface ActionItemsPanelProps {
  sessionId:   number
  showRisk?:   boolean
  onViewMatch: (matchId: number) => void
}


interface AddToMfcState {
  item:       ActionItem
  text:       string
  categoryId: number | null
  itemType:   string
  saving:     boolean
}


const SECTION_CONFIG: Record<string, { title: string; titleClean: string; accent: string }> = {
  high_risk:       { title: 'Critical & High Risk',         titleClean: 'Coverage Gaps',             accent: 'var(--risk-high)' },
  erector_only:    { title: 'Erector-Only (Coverage Gaps)',  titleClean: 'Erector-Only (Unmatched)',  accent: 'var(--match-erector-only)' },
  partial_review:  { title: 'Partial Matches to Review',    titleClean: 'Partial Matches to Review', accent: 'var(--match-partial)' },
}


export default function ActionItemsPanel({ sessionId, showRisk = true, onViewMatch }: ActionItemsPanelProps) {
  const { data, loading, error, refetch } = useApi(
    () => getSessionActionItems(sessionId),
    [sessionId],
  )

  const { categoryMap }      = useCategories()
  const [dismissedOpen, setDismissedOpen] = useState(false)
  const [addToMfc, setAddToMfc]           = useState<AddToMfcState | null>(null)
  const [regenerating, setRegenerating]   = useState(false)
  const [confirmRegen, setConfirmRegen]   = useState(false)

  // Optimistic local state: overlay status changes without refetching
  const [localOverrides, setLocalOverrides] = useState<Map<number, Partial<ActionItem>>>(new Map())

  const items = useMemo(() => {
    if (!data) return []

    return data.items.map(item => {
      const overrides = localOverrides.get(item.id)

      return overrides ? { ...item, ...overrides } : item
    })
  }, [data, localOverrides])

  // Group by section, pull dismissed out
  const { sections, dismissed } = useMemo(() => {
    const sectionMap: Record<string, ActionItem[]> = {}
    const dismissedItems: ActionItem[] = []

    for (const item of items) {
      if (item.status === 'dismissed') {
        dismissedItems.push(item)
      } else {
        if (!sectionMap[item.section]) sectionMap[item.section] = []
        sectionMap[item.section].push(item)
      }
    }

    return { sections: sectionMap, dismissed: dismissedItems }
  }, [items])

  // Recompute summary with local overrides
  const summary = useMemo(() => {
    const s = { total: 0, unreviewed: 0, acknowledged: 0, addressed: 0, dismissed: 0, by_section: {} as Record<string, number> }

    for (const item of items) {
      s.total++
      if (item.status in s) (s as unknown as Record<string, number>)[item.status]++
      s.by_section[item.section] = (s.by_section[item.section] ?? 0) + 1
    }

    return s
  }, [items])

  const handleStatus = useCallback(async (id: number, status: string) => {
    // Optimistic update
    setLocalOverrides(prev => {
      const next = new Map(prev)
      next.set(id, { status })

      return next
    })

    try {
      await updateActionItem(id, { status })
    } catch {
      // Revert on error
      setLocalOverrides(prev => {
        const next = new Map(prev)
        next.delete(id)

        return next
      })
    }
  }, [])

  const handleNotes = useCallback(async (id: number, notes: string) => {
    setLocalOverrides(prev => {
      const next = new Map(prev)
      const existing = prev.get(id) ?? {}
      next.set(id, { ...existing, notes })

      return next
    })

    try {
      await updateActionItem(id, { notes })
    } catch {
      setLocalOverrides(prev => {
        const next = new Map(prev)
        next.delete(id)

        return next
      })
    }
  }, [])

  const handleRegenerate = useCallback(async () => {
    setConfirmRegen(false)
    setRegenerating(true)
    try {
      await generateActionItems(sessionId)
      setLocalOverrides(new Map())
      refetch()
    } finally {
      setRegenerating(false)
    }
  }, [sessionId, refetch])

  // ── Add to MFC flow ─────────────────────────────────────────────

  function openAddToMfc(item: ActionItem) {
    setAddToMfc({
      item,
      text:       item.erector_text ?? '',
      categoryId: item.category_id,
      itemType:   'Exclusion',
      saving:     false,
    })
  }

  async function handleMfcSave() {
    if (!addToMfc || !addToMfc.categoryId || !addToMfc.text.trim()) return

    setAddToMfc(prev => prev ? { ...prev, saving: true } : null)

    try {
      await createMfcExclusion({
        category_id: addToMfc.categoryId,
        exclusion:   addToMfc.text.trim(),
        item_type:   addToMfc.itemType,
      })

      // Mark action item as addressed
      await handleStatus(addToMfc.item.id, 'addressed')
      setAddToMfc(null)
    } catch {
      setAddToMfc(prev => prev ? { ...prev, saving: false } : null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner message="Loading action items..." />

  if (error) return (
    <EmptyState title="Error loading action items" message={error} />
  )

  if (!data || items.length === 0) return (
    <div className="action-items-empty">
      <EmptyState
        title="No action items"
        message="This session has no items requiring attention."
      />
      <button className="action-regen-btn" onClick={() => setConfirmRegen(true)} disabled={regenerating}>
        <RefreshCw size={14} className={regenerating ? 'spinning' : ''} />
        {regenerating ? 'Regenerating...' : 'Regenerate from matches'}
      </button>
      <ConfirmDialog
        open={confirmRegen}
        title="Regenerate Action Items?"
        message="This will remove all existing action items and re-derive them from the current match data. All review progress will be reset to unreviewed."
        confirmLabel="Regenerate"
        variant="danger"
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmRegen(false)}
      />
    </div>
  )

  const sectionOrder = ['high_risk', 'erector_only', 'partial_review']

  return (
    <div className="action-items-panel">
      <div className="action-items-toolbar">
        <button
          className="action-regen-btn"
          onClick={() => setConfirmRegen(true)}
          disabled={regenerating}
          title="Re-derive action items from current match data"
        >
          <RefreshCw size={13} className={regenerating ? 'spinning' : ''} />
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      <ActionSummaryBar summary={summary} />
      <ContractualReviewPanel />

      {/* Main sections */}
      {sectionOrder.map(sectionKey => {
        const sectionItems = sections[sectionKey]
        if (!sectionItems || sectionItems.length === 0) return null

        const config = SECTION_CONFIG[sectionKey]

        return (
          <div key={sectionKey} className="action-section">
            <div className="action-section-header">
              <div
                className="action-section-accent"
                style={{ background: config.accent }}
              />
              <h3>{showRisk ? config.title : config.titleClean}</h3>
              <span className="action-section-count">{sectionItems.length}</span>
            </div>
            <div className="action-section-list">
              {sectionItems.map(item => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  categoryMap={categoryMap}
                  showRisk={showRisk}
                  onStatus={handleStatus}
                  onNotes={handleNotes}
                  onViewMatch={onViewMatch}
                  onAddToMfc={openAddToMfc}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Dismissed section */}
      {dismissed.length > 0 && (
        <div className="action-section dismissed-section">
          <div
            className="action-section-header clickable"
            onClick={() => setDismissedOpen(!dismissedOpen)}
          >
            <div className="action-section-toggle">
              {dismissedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
            <h3>Dismissed</h3>
            <span className="action-section-count">{dismissed.length}</span>
          </div>
          {dismissedOpen && (
            <div className="action-section-list">
              {dismissed.map(item => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  categoryMap={categoryMap}
                  showRisk={showRisk}
                  onStatus={handleStatus}
                  onNotes={handleNotes}
                  onViewMatch={onViewMatch}
                  onAddToMfc={openAddToMfc}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add to MFC modal */}
      {addToMfc && (
        <div className="action-modal-overlay" onClick={() => setAddToMfc(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <div className="action-modal-header">
              <h3>Add to MFC Exclusions</h3>
              <button className="action-icon-btn" onClick={() => setAddToMfc(null)}>
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="action-modal-body">
              <label className="action-modal-label">
                Exclusion Text
                <textarea
                  className="action-modal-textarea"
                  value={addToMfc.text}
                  onChange={e => setAddToMfc({ ...addToMfc, text: e.target.value })}
                  rows={3}
                />
              </label>

              <label className="action-modal-label">
                Category
                <CustomSelect
                  options={Array.from(categoryMap.entries()).map(([id, name]) => ({
                    value: String(id),
                    label: name,
                  }))}
                  value={String(addToMfc.categoryId ?? '')}
                  onChange={v => setAddToMfc({ ...addToMfc, categoryId: Number(v) || null })}
                  placeholder="Select category..."
                />
              </label>

              <label className="action-modal-label">
                Item Type
                <CustomSelect
                  options={[
                    { value: 'Exclusion',     label: 'Exclusion' },
                    { value: 'Inclusion',     label: 'Inclusion' },
                    { value: 'Clarification', label: 'Clarification' },
                  ]}
                  value={addToMfc.itemType}
                  onChange={v => setAddToMfc({ ...addToMfc, itemType: v })}
                />
              </label>
            </div>

            <div className="action-modal-footer">
              <button
                className="action-modal-cancel"
                onClick={() => setAddToMfc(null)}
              >
                Cancel
              </button>
              <button
                className="action-modal-save"
                onClick={handleMfcSave}
                disabled={addToMfc.saving || !addToMfc.categoryId || !addToMfc.text.trim()}
              >
                {addToMfc.saving ? 'Saving...' : 'Create & Mark Addressed'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRegen}
        title="Regenerate Action Items?"
        message="This will remove all existing action items and re-derive them from the current match data. All review progress will be reset to unreviewed."
        confirmLabel="Regenerate"
        variant="danger"
        onConfirm={handleRegenerate}
        onCancel={() => setConfirmRegen(false)}
      />
    </div>
  )
}
