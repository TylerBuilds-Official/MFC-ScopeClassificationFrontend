import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createMfcExclusion } from '../../api/exclusions'
import CustomSelect from '../global/CustomSelect'
import type { Category } from '../../types/category'
import '../../styles/action-items.css'


interface Props {
  open:       boolean
  categories: Category[]
  onClose:    () => void
  onAdded:    () => void
}


export default function AddExclusionDialog({ open, categories, onClose, onAdded }: Props) {
  const [text, setText]             = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [itemType, setItemType]     = useState('Exclusion')
  const [scopeType, setScopeType]   = useState('Supply')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (open) {
      setText('')
      setCategoryId(null)
      setItemType('Exclusion')
      setScopeType('Supply')
    }
  }, [open])


  async function handleSave() {
    if (!categoryId || !text.trim()) return

    setSaving(true)
    try {
      await createMfcExclusion({
        category_id: categoryId,
        exclusion:   text.trim(),
        item_type:   itemType,
        scope_type:  scopeType,
      })
      onAdded()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="action-modal-overlay">
      <div className="action-modal" onClick={e => e.stopPropagation()}>
        <div className="action-modal-header">
          <h3>Add MFC Exclusion</h3>
          <button className="action-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="action-modal-body">
          <label className="action-modal-label">
            Exclusion Text
            <textarea
              className="action-modal-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              autoFocus
            />
          </label>

          <label className="action-modal-label">
            Category
            <CustomSelect
              options={categories.map(c => ({
                value: String(c.Id),
                label: c.Name,
              }))}
              value={String(categoryId ?? '')}
              onChange={v => setCategoryId(Number(v) || null)}
              placeholder="Select category..."
            />
          </label>

          <label className="action-modal-label">
            Item Type
            <CustomSelect
              options={[
                { value: 'Exclusion',    label: 'Exclusion' },
                { value: 'Condition',     label: 'Condition' },
                { value: 'Clarification', label: 'Clarification' },
              ]}
              value={itemType}
              onChange={v => setItemType(v)}
            />
          </label>

          <label className="action-modal-label">
            Scope Type
            <CustomSelect
              options={[
                { value: 'Supply',      label: 'Supply' },
                { value: 'Erect',       label: 'Erect' },
                { value: 'Contractual', label: 'Contractual' },
              ]}
              value={scopeType}
              onChange={v => setScopeType(v)}
            />
          </label>
        </div>

        <div className="action-modal-footer">
          <button className="action-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="action-modal-save"
            onClick={handleSave}
            disabled={saving || !categoryId || !text.trim()}
          >
            {saving ? 'Saving...' : 'Create Exclusion'}
          </button>
        </div>
      </div>
    </div>
  )
}
