import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Check, X, Layers, ChevronDown, ChevronRight, Search, ArrowRight } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import { useApi } from '../hooks/useApi'
import { getCategories } from '../api/categories'
import {
  getMfcExclusions,
  getMfcExclusion,
  createMfcExclusion,
  updateMfcExclusion,
  deleteMfcExclusion,
} from '../api/exclusions'
import type { Category } from '../types/category'
import type { MfcExclusion } from '../types/exclusion'

import CustomSelect from '../components/global/CustomSelect'
import ConfirmDialog from '../components/global/ConfirmDialog'
import '../styles/exclusions.css'
import '../styles/action-items.css'


const ALL_CATEGORIES = -1


interface ParsedSearch {
  raw:    string
  idSearch: number | null
  text:     string
}

function parseSearch(raw: string): ParsedSearch {
  const trimmed = raw.trim()
  const idMatch = trimmed.match(/^#?(\d+)$/)

  return {
    raw:      trimmed,
    idSearch: idMatch ? parseInt(idMatch[1], 10) : null,
    text:     idMatch ? '' : trimmed.toLowerCase(),
  }
}


export default function ExclusionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCatId, setActiveCatId]   = useState<number>(ALL_CATEGORIES)
  const [highlightId, setHighlightId]   = useState<number | null>(null)
  const [searchInput, setSearchInput]   = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  /* ── Deep-link highlight: ?highlight=<id> ────────────────────────── */

  useEffect(() => {
    const raw = searchParams.get('highlight')
    if (!raw) return

    const id = Number(raw)
    if (!id) return

    setHighlightId(id)
    searchParams.delete('highlight')
    setSearchParams(searchParams, { replace: true })

    getMfcExclusion(id)
      .then(exc => setActiveCatId(exc.CategoryId))
      .catch(() => { /* exclusion not found — no-op */ })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchChange(value: string) {
    setSearchInput(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 200)
  }

  function clearSearch() {
    setSearchInput('')
    setDebouncedSearch('')
  }

  const search = useMemo(() => parseSearch(debouncedSearch), [debouncedSearch])

  const cats = useApi(() => getCategories(), [])
  const categories = cats.data?.categories ?? []

  // Fetch all exclusions at page level for cross-category ID lookup
  const allExclData                       = useApi(() => getMfcExclusions(), [])
  const allExclusions: MfcExclusion[]     = allExclData.data?.exclusions ?? []

  const activeCategory = categories.find(c => c.Id === activeCatId)

  return (
    <>
      <Header title="MFC Exclusions" />

      <main className="page-content">
        {cats.loading && <LoadingSpinner message="Loading categories..." />}

        {!cats.loading && categories.length === 0 && (
          <EmptyState title="No categories" message="Create a category first." />
        )}

        {!cats.loading && categories.length > 0 && (
          <div className="exclusion-layout">
            <CategorySidebar
              categories={categories}
              activeCatId={activeCatId}
              onSelect={setActiveCatId}
            />

            <div className="exclusion-panel">
              <ExclusionSearchBar
                value={searchInput}
                onChange={handleSearchChange}
                onClear={clearSearch}
              />

              {activeCatId === ALL_CATEGORIES ? (
                <AllExclusionsPanel
                  categories={categories}
                  search={search}
                />
              ) : activeCategory ? (
                <ExclusionPanel
                  key={activeCatId}
                  category={activeCategory}
                  search={search}
                  allExclusions={allExclusions}
                  categories={categories}
                  onNavigate={(catId) => { setActiveCatId(catId) }}
                  highlightId={highlightId}
                  onHighlightDone={() => setHighlightId(null)}
                />
              ) : null}
            </div>
          </div>
        )}
      </main>
    </>
  )
}


/* ── Search Bar ──────────────────────────────────────────────────── */

interface ExclusionSearchBarProps {
  value:    string
  onChange: (value: string) => void
  onClear:  () => void
}

function ExclusionSearchBar({ value, onChange, onClear }: ExclusionSearchBarProps) {
  return (
    <div className="excl-search-bar">
      <Search size={14} className="excl-search-icon" />
      <input
        type="text"
        className="excl-search-input"
        placeholder="Search by text or #ID..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className="excl-search-clear" onClick={onClear}>
          <X size={13} />
        </button>
      )}
    </div>
  )
}


/* ── Category Sidebar ────────────────────────────────────────────── */

interface CategorySidebarProps {
  categories:  Category[]
  activeCatId: number
  onSelect:    (id: number) => void
}

function CategorySidebar({ categories, activeCatId, onSelect }: CategorySidebarProps) {
  return (
    <div className="category-sidebar">
      <div className="category-sidebar-header">
        <h3>Categories</h3>
      </div>

      <div
        className={`cat-nav-item ${activeCatId === ALL_CATEGORIES ? 'active' : ''}`}
        onClick={() => onSelect(ALL_CATEGORIES)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={14} style={{ opacity: 0.6 }} />
          <div className="cat-name">All Categories</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border-subtle)' }} />

      {categories.map(cat => (
        <div
          key={cat.Id}
          className={`cat-nav-item ${cat.Id === activeCatId ? 'active' : ''}`}
          onClick={() => onSelect(cat.Id)}
        >
          <div>
            <div className="cat-name">{cat.Name}</div>
            {cat.Description && (
              <div className="cat-description">{cat.Description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}


/* ── All Exclusions Panel ────────────────────────────────────────── */

interface AllExclusionsPanelProps {
  categories: Category[]
  search:     ParsedSearch
}

interface AddExclusionState {
  text:       string
  categoryId: number | null
  itemType:   string
  saving:     boolean
}

const ITEM_TYPES = ['Exclusion', 'Condition', 'Clarification'] as const

function AllExclusionsPanel({ categories, search }: AllExclusionsPanelProps) {
  const [collapsed, setCollapsed]     = useState<Set<number>>(new Set())
  const [editId, setEditId]           = useState<number | null>(null)
  const [busy, setBusy]               = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MfcExclusion | null>(null)
  const [addModal, setAddModal]       = useState<AddExclusionState | null>(null)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())

  const { data, loading, refetch } = useApi(() => getMfcExclusions(), [])
  const exclusions                 = data?.exclusions ?? []

  const isSearching   = search.raw.length > 0
  const isTypeFiltered = activeTypes.size > 0
  const isFiltering    = isSearching || isTypeFiltered

  function toggleType(type: string) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else                next.add(type)

      return next
    })
  }

  function toggleCollapse(catId: number) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else                 next.add(catId)

      return next
    })
  }

  const catMap = new Map(categories.map(c => [c.Id, c.Name]))

  // Filter exclusions based on search + type
  const filtered = useMemo(() => {
    return exclusions.filter(exc => {
      if (isTypeFiltered && !activeTypes.has(exc.ItemType)) return false

      if (!isSearching) return true

      if (search.idSearch !== null) return exc.Id === search.idSearch

      return exc.Exclusion.toLowerCase().includes(search.text)
    })
  }, [exclusions, search, isSearching, isTypeFiltered, activeTypes])

  // Group by category, maintain sort order
  const grouped = new Map<number, MfcExclusion[]>()
  for (const exc of filtered) {
    if (!grouped.has(exc.CategoryId)) grouped.set(exc.CategoryId, [])
    grouped.get(exc.CategoryId)!.push(exc)
  }

  // Sort groups by category SortOrder
  const catOrder = new Map(categories.map(c => [c.Id, c.SortOrder]))
  const sortedGroups = Array.from(grouped.entries())
    .sort(([a], [b]) => (catOrder.get(a) ?? 999) - (catOrder.get(b) ?? 999))

  // Auto-expand groups that contain filtered results
  const effectiveCollapsed = useMemo(() => {
    if (!isFiltering) return collapsed

    const matchedCatIds = new Set(sortedGroups.map(([id]) => id))
    const next          = new Set(collapsed)

    for (const id of matchedCatIds) next.delete(id)

    return next
  }, [collapsed, sortedGroups, isFiltering])

  const allCatIds    = sortedGroups.map(([id]) => id)
  const allCollapsed = allCatIds.length > 0 && allCatIds.every(id => effectiveCollapsed.has(id))

  function toggleAll() {
    if (allCollapsed) {
      setCollapsed(new Set())
    } else {
      setCollapsed(new Set(allCatIds))
    }
  }

  const matchedIds = isFiltering ? new Set(filtered.map(e => e.Id)) : null

  function openAddModal() {
    setAddModal({ text: '', categoryId: null, itemType: 'Exclusion', saving: false })
  }

  async function handleAddSave() {
    if (!addModal || !addModal.categoryId || !addModal.text.trim()) return

    setAddModal(prev => prev ? { ...prev, saving: true } : null)
    try {
      await createMfcExclusion({
        category_id: addModal.categoryId,
        exclusion:   addModal.text.trim(),
        item_type:   addModal.itemType,
      })
      setAddModal(null)
      refetch()
    } catch {
      setAddModal(prev => prev ? { ...prev, saving: false } : null)
    }
  }

  return (
    <>
      <div className="exclusion-panel-header">
        <h3>All MFC Exclusions</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="filter-chip-count">
            {isFiltering ? `${filtered.length} of ${exclusions.length}` : `${exclusions.length} items`}
          </span>
          {sortedGroups.length > 0 && !isFiltering && (
            <button className="btn-sm ghost" onClick={toggleAll}>
              {allCollapsed ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {allCollapsed ? 'Expand All' : 'Collapse All'}
            </button>
          )}
          <button className="add-btn" onClick={openAddModal}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="excl-type-filter-bar">
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            className={`excl-type-chip ${type.toLowerCase()} ${activeTypes.has(type) ? 'active' : ''}`}
            onClick={() => toggleType(type)}
          >
            {type}
          </button>
        ))}
        {isTypeFiltered && (
          <button
            className="excl-type-chip clear"
            onClick={() => setActiveTypes(new Set())}
          >
            Clear
          </button>
        )}
      </div>

      <div className="exclusion-panel-body">
        {loading && <LoadingSpinner message="Loading exclusions..." />}

        {!loading && exclusions.length === 0 && (
          <EmptyState title="No exclusions" message="No MFC exclusions have been created yet." />
        )}

        {!loading && isFiltering && filtered.length === 0 && exclusions.length > 0 && (
          <EmptyState
            title="No results"
            message={
              isSearching && search.idSearch !== null
                ? `No exclusion found with ID #${search.idSearch}.`
                : isSearching
                  ? `No exclusions matching "${search.raw}"${isTypeFiltered ? ' with selected types' : ''}.`
                  : 'No exclusions match the selected type filters.'
            }
          />
        )}

        {sortedGroups.map(([catId, items]) => {
          const isOpen = !effectiveCollapsed.has(catId)

          return (
            <div key={catId}>
              <div
                className="all-excl-category-header"
                onClick={() => toggleCollapse(catId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {catMap.get(catId) ?? `Category ${catId}`}
                </div>
                <span className="all-excl-category-count">{items.length}</span>
              </div>
              {isOpen && items.map(exc => (
                editId === exc.Id ? (
                  <InlineForm
                    key={exc.Id}
                    initial={exc}
                    onSave={async (text, type) => {
                      setBusy(true)
                      try {
                        await updateMfcExclusion(exc.Id, { exclusion: text, item_type: type })
                        setEditId(null)
                        refetch()
                      } finally {
                        setBusy(false)
                      }
                    }}
                    onCancel={() => setEditId(null)}
                    busy={busy}
                  />
                ) : (
                  <ExclusionRow
                    key={exc.Id}
                    exclusion={exc}
                    onEdit={() => setEditId(exc.Id)}
                    onDelete={() => setDeleteTarget(exc)}
                    highlight={matchedIds?.has(exc.Id) ?? false}
                  />
                )
              ))}
            </div>
          )
        })}
      </div>

      {addModal && (
        <div className="action-modal-overlay" onClick={() => setAddModal(null)}>
          <div className="action-modal" onClick={e => e.stopPropagation()}>
            <div className="action-modal-header">
              <h3>Add MFC Exclusion</h3>
              <button className="action-icon-btn" onClick={() => setAddModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="action-modal-body">
              <label className="action-modal-label">
                Exclusion Text
                <textarea
                  className="action-modal-textarea"
                  value={addModal.text}
                  onChange={e => setAddModal({ ...addModal, text: e.target.value })}
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
                  value={String(addModal.categoryId ?? '')}
                  onChange={v => setAddModal({ ...addModal, categoryId: Number(v) || null })}
                  placeholder="Select category..."
                />
              </label>

              <label className="action-modal-label">
                Item Type
                <CustomSelect
                  options={[
                    { value: 'Exclusion',     label: 'Exclusion' },
                    { value: 'Condition',      label: 'Condition' },
                    { value: 'Clarification',  label: 'Clarification' },
                  ]}
                  value={addModal.itemType}
                  onChange={v => setAddModal({ ...addModal, itemType: v })}
                />
              </label>
            </div>

            <div className="action-modal-footer">
              <button
                className="action-modal-cancel"
                onClick={() => setAddModal(null)}
              >
                Cancel
              </button>
              <button
                className="action-modal-save"
                onClick={handleAddSave}
                disabled={addModal.saving || !addModal.categoryId || !addModal.text.trim()}
              >
                {addModal.saving ? 'Saving...' : 'Create Exclusion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete MFC Exclusion?"
        message={deleteTarget
          ? `This will permanently remove exclusion #${deleteTarget.Id}: "${deleteTarget.Exclusion.slice(0, 80)}${deleteTarget.Exclusion.length > 80 ? '...' : ''}"\n\nThis cannot be undone.`
          : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (!deleteTarget) return
          const id = deleteTarget.Id
          setDeleteTarget(null)
          setBusy(true)
          try {
            await deleteMfcExclusion(id)
            refetch()
          } finally {
            setBusy(false)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}




/* ── Single Category Panel ───────────────────────────────────────── */

interface ExclusionPanelProps {
  category:         Category
  search:           ParsedSearch
  allExclusions:    MfcExclusion[]
  categories:       Category[]
  onNavigate:       (catId: number) => void
  highlightId?:     number | null
  onHighlightDone?: () => void
}

function ExclusionPanel({ category, search, allExclusions, categories, onNavigate, highlightId, onHighlightDone }: ExclusionPanelProps) {
  const [adding, setAdding]             = useState(false)
  const [editId, setEditId]             = useState<number | null>(null)
  const [busy, setBusy]                 = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MfcExclusion | null>(null)
  const [activeTypes, setActiveTypes]   = useState<Set<string>>(new Set())

  const { data, loading, refetch } = useApi(
    () => getMfcExclusions(category.Id),
    [category.Id],
  )

  const exclusions = data?.exclusions ?? []

  /* ── Deep-link: scroll to highlighted row once data loads ──────── */

  useEffect(() => {
    if (!highlightId || loading || exclusions.length === 0) return

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-excl-id="${highlightId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('deep-link-highlight')

        const cleanup = () => {
          el.classList.remove('deep-link-highlight')
          onHighlightDone?.()
        }

        el.addEventListener('animationend', cleanup, { once: true })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [highlightId, loading, exclusions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const isSearching   = search.raw.length > 0
  const isTypeFiltered = activeTypes.size > 0
  const isFiltering    = isSearching || isTypeFiltered

  function toggleType(type: string) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else                next.add(type)

      return next
    })
  }

  const filtered = useMemo(() => {
    return exclusions.filter(exc => {
      if (isTypeFiltered && !activeTypes.has(exc.ItemType)) return false

      if (!isSearching) return true

      if (search.idSearch !== null) return exc.Id === search.idSearch

      return exc.Exclusion.toLowerCase().includes(search.text)
    })
  }, [exclusions, search, isSearching, isTypeFiltered, activeTypes])

  // Cross-category hint: ID was searched but not found in this category
  const crossCatHint = useMemo(() => {
    if (!isSearching || search.idSearch === null) return null
    if (filtered.length > 0) return null

    const found = allExclusions.find(e => e.Id === search.idSearch)
    if (!found) return null

    const catName = categories.find(c => c.Id === found.CategoryId)?.Name ?? `Category ${found.CategoryId}`

    return { exclusion: found, catName, catId: found.CategoryId }
  }, [isSearching, search, filtered, allExclusions, categories])

  const matchedIds = isFiltering ? new Set(filtered.map(e => e.Id)) : null

  const handleCreate = useCallback(async (text: string, itemType: string) => {
    setBusy(true)
    try {
      await createMfcExclusion({
        category_id: category.Id,
        exclusion:   text,
        item_type:   itemType,
        sort_order:  exclusions.length + 1,
      })
      setAdding(false)
      refetch()
    } finally {
      setBusy(false)
    }
  }, [category.Id, exclusions.length, refetch])

  const handleUpdate = useCallback(async (id: number, text: string, itemType: string) => {
    setBusy(true)
    try {
      await updateMfcExclusion(id, { exclusion: text, item_type: itemType })
      setEditId(null)
      refetch()
    } finally {
      setBusy(false)
    }
  }, [refetch])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return

    const id = deleteTarget.Id
    setDeleteTarget(null)
    setBusy(true)
    try {
      await deleteMfcExclusion(id)
      refetch()
    } finally {
      setBusy(false)
    }
  }, [deleteTarget, refetch])

  return (
    <>
      <div className="exclusion-panel-header">
        <h3>{category.Name}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="filter-chip-count">
            {isFiltering ? `${filtered.length} of ${exclusions.length}` : `${exclusions.length} items`}
          </span>
          <button className="add-btn" onClick={() => setAdding(true)} disabled={adding}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="excl-type-filter-bar">
        {ITEM_TYPES.map(type => (
          <button
            key={type}
            className={`excl-type-chip ${type.toLowerCase()} ${activeTypes.has(type) ? 'active' : ''}`}
            onClick={() => toggleType(type)}
          >
            {type}
          </button>
        ))}
        {isTypeFiltered && (
          <button
            className="excl-type-chip clear"
            onClick={() => setActiveTypes(new Set())}
          >
            Clear
          </button>
        )}
      </div>

      <div className="exclusion-panel-body">
        {loading && <LoadingSpinner message="Loading exclusions..." />}

        {adding && (
          <InlineForm
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            busy={busy}
          />
        )}

        {!loading && !isFiltering && exclusions.length === 0 && !adding && (
          <EmptyState
            title="No exclusions"
            message={`No MFC exclusions in ${category.Name} yet.`}
          />
        )}

        {!loading && isFiltering && filtered.length === 0 && !crossCatHint && (
          <EmptyState
            title="No results"
            message={
              isSearching && search.idSearch !== null
                ? `No exclusion with ID #${search.idSearch} in ${category.Name}.`
                : isSearching
                  ? `No exclusions matching "${search.raw}"${isTypeFiltered ? ' with selected types' : ''} in ${category.Name}.`
                  : `No ${Array.from(activeTypes).join(' or ').toLowerCase()} items in ${category.Name}.`
            }
          />
        )}

        {crossCatHint && (
          <div className="excl-cross-cat-hint">
            <span>
              Exclusion <strong>#{crossCatHint.exclusion.Id}</strong> is in <strong>{crossCatHint.catName}</strong>
            </span>
            <button
              className="btn-sm ghost"
              onClick={() => onNavigate(crossCatHint.catId)}
            >
              Go to {crossCatHint.catName} <ArrowRight size={12} />
            </button>
          </div>
        )}

        {filtered.map(exc => (
          editId === exc.Id ? (
            <InlineForm
              key={exc.Id}
              initial={exc}
              onSave={(text, type) => handleUpdate(exc.Id, text, type)}
              onCancel={() => setEditId(null)}
              busy={busy}
            />
          ) : (
            <ExclusionRow
              key={exc.Id}
              exclusion={exc}
              onEdit={() => setEditId(exc.Id)}
              onDelete={() => setDeleteTarget(exc)}
              highlight={matchedIds?.has(exc.Id) ?? false}
            />
          )
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete MFC Exclusion?"
        message={deleteTarget
          ? `This will permanently remove exclusion #${deleteTarget.Id}: "${deleteTarget.Exclusion.slice(0, 80)}${deleteTarget.Exclusion.length > 80 ? '...' : ''}"\n\nThis cannot be undone.`
          : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}


/* ── Exclusion Row (editable) ────────────────────────────────────── */

interface ExclusionRowProps {
  exclusion:  MfcExclusion
  onEdit:     () => void
  onDelete:   () => void
  highlight?: boolean
}

function ExclusionRow({ exclusion, onEdit, onDelete, highlight }: ExclusionRowProps) {
  const typeClass = exclusion.ItemType.toLowerCase()

  return (
    <div
      className={`exclusion-row ${highlight ? 'search-highlight' : ''}`}
      data-excl-id={exclusion.Id}
    >
      <span className="excl-id">#{exclusion.Id}</span>
      <div className="excl-body">
        <div className="excl-text">{exclusion.Exclusion}</div>
        <div className="excl-meta">
          <span className={`excl-type-badge ${typeClass}`}>{exclusion.ItemType}</span>
        </div>
      </div>
      <div className="excl-actions">
        <button className="excl-action-btn" onClick={onEdit} title="Edit">
          <Pencil size={14} />
        </button>
        <button className="excl-action-btn danger" onClick={onDelete} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}


/* ── Inline Form (add / edit) ────────────────────────────────────── */

interface InlineFormProps {
  initial?:  MfcExclusion
  onSave:    (text: string, itemType: string) => void
  onCancel:  () => void
  busy:      boolean
}

function InlineForm({ initial, onSave, onCancel, busy }: InlineFormProps) {
  const [text, setText]         = useState(initial?.Exclusion ?? '')
  const [itemType, setItemType] = useState(initial?.ItemType ?? 'Exclusion')

  const canSave = text.trim().length > 0 && !busy

  return (
    <div className="excl-inline-form">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter exclusion text..."
        autoFocus
      />
      <div className="excl-form-row">
        <CustomSelect
          options={[
            { value: 'Exclusion',     label: 'Exclusion' },
            { value: 'Condition',      label: 'Condition' },
            { value: 'Clarification',  label: 'Clarification' },
          ]}
          value={itemType}
          onChange={setItemType}
        />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn-sm ghost" onClick={onCancel} disabled={busy}>
            <X size={13} /> Cancel
          </button>
          <button
            className="btn-sm primary"
            onClick={() => onSave(text.trim(), itemType)}
            disabled={!canSave}
          >
            <Check size={13} /> {initial ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
