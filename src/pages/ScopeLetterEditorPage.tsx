import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import EditorParagraph from '../components/editor/EditorParagraph'
import EditorToolbar from '../components/editor/EditorToolbar'
import RegionDetail from '../components/editor/RegionDetail'
import { useApi } from '../hooks/useApi'
import { getScopeLetterData, downloadScopeLetter } from '../api/export'
import type { EditorRegion } from '../types/editor'

import '../styles/editor.css'


export default function ScopeLetterEditorPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const sessionId = Number(id)

  const { data, loading, error } = useApi(
    () => getScopeLetterData(sessionId),
    [sessionId],
  )

  // Local state for edits
  const [textOverrides, setTextOverrides]     = useState<Map<number, string>>(new Map())
  const [removedParas, setRemovedParas]       = useState<Set<number>>(new Set())
  const [removedRegions, setRemovedRegions]   = useState<Set<string>>(new Set())
  const [activeRegion, setActiveRegion]       = useState<EditorRegion | null>(null)
  const [showUnmatched, setShowUnmatched]     = useState(true)
  const [exporting, setExporting]             = useState(false)

  // Build effective paragraphs with overrides applied
  const paragraphs = useMemo(() => {
    if (!data) return []

    return data.paragraphs.map(p => {
      const text = textOverrides.get(p.index) ?? p.text

      return { ...p, text }
    })
  }, [data, textOverrides])

  // Stats
  const stats = useMemo(() => {
    let aligned   = 0
    let partial   = 0
    let unmatched = 0

    for (const p of paragraphs) {
      if (removedParas.has(p.index)) continue

      for (const r of p.regions) {
        if (removedRegions.has(`${p.index}:${r.mfc_id}`)) continue

        if (r.match_type === 'Aligned')      aligned++
        else if (r.match_type === 'Partial') partial++
        else                                 unmatched++
      }
    }

    return { total: aligned + partial + unmatched, aligned, partial, unmatched, removed: removedParas.size }
  }, [paragraphs, removedParas, removedRegions])

  const handleTextChange = useCallback((index: number, text: string) => {
    setTextOverrides(prev => new Map(prev).set(index, text))
  }, [])

  const handleRemovePara = useCallback((index: number) => {
    setRemovedParas(prev => new Set(prev).add(index))
  }, [])

  const handleRestorePara = useCallback((index: number) => {
    setRemovedParas(prev => {
      const next = new Set(prev)
      next.delete(index)

      return next
    })
  }, [])

  const handleRegionClick = useCallback((region: EditorRegion) => {
    setActiveRegion(region)
  }, [])

  const handleRemoveRegion = useCallback((paraIndex: number, mfcId: number) => {
    setRemovedRegions(prev => new Set(prev).add(`${paraIndex}:${mfcId}`))
  }, [])

  const handleRemoveAllUnmatched = useCallback(() => {
    const newRemoved = new Set(removedRegions)

    for (const p of paragraphs) {
      for (const r of p.regions) {
        if (!r.match_type) {
          newRemoved.add(`${p.index}:${r.mfc_id}`)
        }
      }
    }

    setRemovedRegions(newRemoved)
  }, [paragraphs, removedRegions])

  async function handleExport() {
    setExporting(true)
    try {
      await downloadScopeLetter(sessionId)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

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
          <button className="editor-back-btn" onClick={() => navigate(`/reviews/${sessionId}`)}>
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <EditorToolbar
          stats={stats}
          showUnmatched={showUnmatched}
          onToggleUnmatched={() => setShowUnmatched(!showUnmatched)}
          onRemoveAllUnmatched={handleRemoveAllUnmatched}
          onExport={handleExport}
          exporting={exporting}
        />
      </div>

      <div className="editor-layout">
        <div className="editor-doc">
          {paragraphs.map(p => (
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

        {activeRegion && (
          <div className="editor-sidebar">
            <RegionDetail
              region={activeRegion}
              onClose={() => setActiveRegion(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
