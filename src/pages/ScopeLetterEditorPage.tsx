import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'

import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import ConfirmDialog from '../components/global/ConfirmDialog'
import EditorParagraph from '../components/editor/EditorParagraph'
import EditorToolbar from '../components/editor/EditorToolbar'
import RegionDetail from '../components/editor/RegionDetail'
import RemovedItemsPanel from '../components/editor/RemovedItemsPanel'
import type { RemovedItem } from '../components/editor/RemovedItemsPanel'
import { useApi } from '../hooks/useApi'
import { getScopeLetterData, downloadEditorExport } from '../api/export'
import {
  removeRegion as apiRemoveRegion,
  restoreRegion as apiRestoreRegion,
  removeParagraph as apiRemoveParagraph,
  restoreParagraph as apiRestoreParagraph,
  saveTextEdit as apiSaveTextEdit,
  resetEditorState as apiResetEditorState,
  updateHighlightIntensity as apiUpdateHighlightIntensity,
} from '../api/editor'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../context/ThemeContext'
import type { EditorRegion, EditorViewMode, HighlightIntensity } from '../types/editor'

import '../styles/editor.css'


export default function ScopeLetterEditorPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const sessionId = Number(id)

  const { data, loading, error, refetch } = useApi(
    () => getScopeLetterData(sessionId),
    [sessionId],
  )

  // ── Local editor state ────────────────────────────────────────────
  const [textOverrides, setTextOverrides]     = useState<Map<number, string>>(new Map())
  const [removedParas, setRemovedParas]       = useState<Set<number>>(new Set())
  const [removedRegions, setRemovedRegions]   = useState<Set<string>>(new Set())
  const [activeRegion, setActiveRegion]       = useState<EditorRegion | null>(null)
  const [viewMode, setViewMode]               = useState<EditorViewMode>('erector_exclusions')
  const { user }               = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [highlightIntensity, setHighlightIntensity] = useState<HighlightIntensity>(
    (user?.highlight_intensity as HighlightIntensity) ?? 'standard'
  )
  const [exporting, setExporting]             = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Debounce timer ref for text edits
  const textEditTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // ── Hydrate local state from persisted editor_state ───────────────
  useEffect(() => {
    if (!data?.editor_state) return

    const { removed_regions, removed_paragraphs, text_edits } = data.editor_state

    // Removed regions → Set of "paraIndex:mfcExclusionId"
    const regionSet = new Set<string>()
    for (const r of removed_regions) {
      regionSet.add(`${r.para_index}:${r.mfc_exclusion_id}`)
    }
    setRemovedRegions(regionSet)

    // Removed paragraphs → Set of paraIndex
    setRemovedParas(new Set(removed_paragraphs))

    // Text edits → Map of paraIndex → editedText
    const editMap = new Map<number, string>()
    for (const e of text_edits) {
      editMap.set(e.para_index, e.edited_text)
    }
    setTextOverrides(editMap)

  }, [data])

  // ── Derived data ──────────────────────────────────────────────────

  // Build effective paragraphs with text overrides applied
  const paragraphs = useMemo(() => {
    if (!data) return []

    return data.paragraphs.map(p => {
      const text = textOverrides.get(p.index) ?? p.text

      return { ...p, text }
    })
  }, [data, textOverrides])

  // Filter paragraphs based on view mode
  const visibleParagraphs = useMemo(() => {
    if (viewMode === 'full') return paragraphs

    return paragraphs.filter(p => p.template_section === viewMode)
  }, [paragraphs, viewMode])

  // Stats (computed from visible paragraphs only)
  const stats = useMemo(() => {
    let aligned   = 0
    let partial   = 0
    let unmatched = 0

    for (const p of visibleParagraphs) {
      if (removedParas.has(p.index)) continue

      for (const r of p.regions) {
        if (removedRegions.has(`${p.index}:${r.mfc_id}`)) continue

        if (r.match_type === 'Aligned')      aligned++
        else if (r.match_type === 'Partial') partial++
        else                                 unmatched++
      }
    }

    return { total: aligned + partial + unmatched, aligned, partial, unmatched, removed: removedRegions.size + removedParas.size }
  }, [visibleParagraphs, removedParas, removedRegions])

  // Build list of removed items for the panel
  const removedItems = useMemo((): RemovedItem[] => {
    const items: RemovedItem[] = []

    // Removed regions — resolve snippet + match type from paragraph data
    for (const key of removedRegions) {
      const [paraStr, mfcStr] = key.split(':')
      const paraIndex         = Number(paraStr)
      const mfcId             = Number(mfcStr)
      const para              = paragraphs.find(p => p.index === paraIndex)
      const region            = para?.regions.find(r => r.mfc_id === mfcId)

      items.push({
        type:      'region',
        key,
        paraIndex,
        mfcId,
        snippet:   region?.snippet ?? `MFC #${mfcId}`,
        matchType: region?.match_type ?? null,
      })
    }

    // Removed paragraphs — use first 80 chars of text
    for (const paraIndex of removedParas) {
      const para = paragraphs.find(p => p.index === paraIndex)
      const text = para?.text?.trim() ?? ''

      items.push({
        type:      'paragraph',
        key:       `para:${paraIndex}`,
        paraIndex,
        snippet:   text.length > 80 ? text.slice(0, 80) + '...' : text || `Paragraph ${paraIndex}`,
        matchType: null,
      })
    }

    return items
  }, [removedRegions, removedParas, paragraphs])

  // ── Handlers (optimistic local update + async persist) ────────────

  const handleTextChange = useCallback((index: number, text: string) => {
    setTextOverrides(prev => new Map(prev).set(index, text))

    // Debounce API call — 800ms after last keystroke
    const existing = textEditTimers.current.get(index)
    if (existing) clearTimeout(existing)

    textEditTimers.current.set(index, setTimeout(() => {
      apiSaveTextEdit(sessionId, index, text).catch(err =>
        console.error(`Failed to persist text edit para ${index}:`, err)
      )
      textEditTimers.current.delete(index)
    }, 800))
  }, [sessionId])

  const handleRemovePara = useCallback((index: number) => {
    setRemovedParas(prev => new Set(prev).add(index))

    apiRemoveParagraph(sessionId, index).catch(err =>
      console.error(`Failed to persist paragraph removal ${index}:`, err)
    )
  }, [sessionId])

  const handleRestorePara = useCallback((index: number) => {
    setRemovedParas(prev => {
      const next = new Set(prev)
      next.delete(index)

      return next
    })

    apiRestoreParagraph(sessionId, index).catch(err =>
      console.error(`Failed to persist paragraph restore ${index}:`, err)
    )
  }, [sessionId])

  const handleRegionClick = useCallback((region: EditorRegion) => {
    setActiveRegion(region)
  }, [])

  const handleRemoveRegion = useCallback((paraIndex: number, mfcId: number) => {
    setRemovedRegions(prev => new Set(prev).add(`${paraIndex}:${mfcId}`))

    apiRemoveRegion(sessionId, mfcId, paraIndex).catch(err =>
      console.error(`Failed to persist region removal ${mfcId}:`, err)
    )
  }, [sessionId])

  const handleRestoreRegion = useCallback((paraIndex: number, mfcId: number) => {
    setRemovedRegions(prev => {
      const next = new Set(prev)
      next.delete(`${paraIndex}:${mfcId}`)

      return next
    })

    apiRestoreRegion(sessionId, mfcId).catch(err =>
      console.error(`Failed to persist region restore ${mfcId}:`, err)
    )
  }, [sessionId])

  const handleRemoveAllUnmatched = useCallback(() => {
    const newRemoved = new Set(removedRegions)
    const additions: { paraIndex: number; mfcId: number }[] = []

    for (const p of visibleParagraphs) {
      for (const r of p.regions) {
        if (r.match_type !== 'Aligned' && r.match_type !== 'Partial') {
          const key = `${p.index}:${r.mfc_id}`
          if (!newRemoved.has(key)) {
            newRemoved.add(key)
            additions.push({ paraIndex: p.index, mfcId: r.mfc_id })
          }
        }
      }
    }

    setRemovedRegions(newRemoved)

    // Persist each removal (fire-and-forget batch)
    for (const { paraIndex, mfcId } of additions) {
      apiRemoveRegion(sessionId, mfcId, paraIndex).catch(err =>
        console.error(`Failed to persist region removal ${mfcId}:`, err)
      )
    }
  }, [sessionId, visibleParagraphs, removedRegions])

  const handleReset = useCallback(async () => {
    try {
      await apiResetEditorState(sessionId)

      // Clear all local state
      setRemovedRegions(new Set())
      setRemovedParas(new Set())
      setTextOverrides(new Map())
      setActiveRegion(null)
      setShowResetConfirm(false)

      // Refetch to get clean data
      refetch()
    } catch (err) {
      console.error('Failed to reset editor state:', err)
    }
  }, [sessionId, refetch])

  async function handleExport() {
    setExporting(true)
    try {
      await downloadEditorExport(sessionId, viewMode)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="page-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <div className="editor-header-title"><h2>Scope Letter Editor</h2></div>
        </div>
      </div>
      <LoadingSpinner message="Loading scope letter..." />
    </div>
  )

  if (error || !data) return (
    <div className="page-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <div className="editor-header-title"><h2>Scope Letter Editor</h2></div>
        </div>
      </div>
      <EmptyState title="Failed to load" message={error ?? 'No data returned.'} />
    </div>
  )

  return (
    <div className="page-container">
      <div className="editor-header">
        <div className="editor-header-top">
          <div className="editor-header-title">
            <h2>Scope Letter Editor</h2>
            <div className="editor-meta">
              <span className="editor-meta-label">{data.session.erector}</span>
              <span className="editor-meta-sep" />
              <span className="editor-meta-value">{data.session.job}</span>
              {data.session.job_name && (
                <>
                  <span className="editor-meta-sep" />
                  <span className="editor-meta-value">{data.session.job_name}</span>
                </>
              )}
            </div>
          </div>
          <div className="editor-header-actions">
            <button className="editor-back-btn" onClick={() => navigate(`/reviews/${sessionId}`)}>
              <ArrowLeft size={14} />
              Back
            </button>
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
        </div>

        <EditorToolbar
          stats={stats}
          viewMode={viewMode}
          highlightIntensity={highlightIntensity}
          onViewModeChange={setViewMode}
          onHighlightIntensityChange={(level) => {
            setHighlightIntensity(level)
            apiUpdateHighlightIntensity(level).catch(err =>
              console.error('Failed to persist highlight intensity:', err)
            )
          }}
          onRemoveAllUnmatched={handleRemoveAllUnmatched}
          onExport={handleExport}
          onReset={() => setShowResetConfirm(true)}
          exporting={exporting}
        />
      </div>

      <div className="editor-layout">
        <div className="editor-doc" data-highlight={highlightIntensity}>
          {visibleParagraphs.map(p => (
            <EditorParagraph
              key={p.index}
              paragraph={p}
              removed={removedParas.has(p.index)}
              removedRegions={removedRegions}
              onTextChange={handleTextChange}
              onRemovePara={handleRemovePara}
              onRestorePara={handleRestorePara}
              onRegionClick={handleRegionClick}
              onRemoveRegion={handleRemoveRegion}
            />
          ))}
        </div>

        <div className={`editor-sidebar ${activeRegion || removedItems.length > 0 ? 'open' : ''}`}>
          <div className="editor-sidebar-scroll">
            {activeRegion && (
              <RegionDetail
                region={activeRegion}
                onClose={() => setActiveRegion(null)}
              />
            )}
            <RemovedItemsPanel
              items={removedItems}
              onRestoreRegion={handleRestoreRegion}
              onRestoreParagraph={handleRestorePara}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset All Edits"
        message="This will discard all removals, restorations, and text edits for this session. This cannot be undone."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  )
}
