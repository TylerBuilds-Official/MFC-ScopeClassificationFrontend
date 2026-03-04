import { useState, useEffect, useCallback } from 'react'
import {
  GraduationCap, CheckCircle2, ArrowRight, AlertTriangle,
  ChevronDown, Sparkles, Trophy, BarChart3,
} from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import CustomSelect from '../components/global/CustomSelect'
import { getTrainingQueue, submitVerification } from '../api/training'
import { getCategories } from '../api/categories'
import type { TrainingQueueItem, TrainingQueueResponse } from '../types/training'
import type { Category } from '../types/category'

import '../styles/training.css'


const CONFIDENCE_OPTIONS = [
  { value: '0.60', label: '≤ 0.60 (Very low)' },
  { value: '0.65', label: '≤ 0.65 (Low)' },
  { value: '0.70', label: '≤ 0.70 (Below avg)' },
  { value: '0.72', label: '≤ 0.72 (Default)' },
  { value: '0.80', label: '≤ 0.80 (Moderate)' },
  { value: '0.85', label: '≤ 0.85 (Broad)' },
]


export default function TrainingPage() {
  const [queue, setQueue]               = useState<TrainingQueueItem[]>([])
  const [totalPending, setTotalPending] = useState(0)
  const [totalVerified, setTotalVerified]     = useState(0)
  const [totalOverridden, setTotalOverridden] = useState(0)
  const [categories, setCategories]     = useState<Category[]>([])
  const [maxConfidence, setMaxConfidence] = useState(0.72)
  const [loading, setLoading]           = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideDir, setSlideDir]         = useState<'in' | 'out' | null>(null)
  const [correcting, setCorrecting]     = useState(false)
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null)
  const [saving, setSaving]             = useState(false)
  const [sessionVerified, setSessionVerified] = useState(0)
  const [sessionCorrected, setSessionCorrected] = useState(0)
  const [showIntro, setShowIntro]       = useState(true)
  const [confirmingSkip, setConfirmingSkip]   = useState(false)
  const [suppressSkipWarn, setSuppressSkipWarn] = useState(false)

  const currentItem = queue[currentIndex] ?? null
  const accuracyRate = totalVerified > 0
    ? ((totalVerified - totalOverridden) / totalVerified * 100).toFixed(1)
    : null

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [queueRes, catRes] = await Promise.all([
        getTrainingQueue({ max_confidence: maxConfidence, limit: 100 }),
        getCategories(),
      ])
      setQueue(queueRes.items)
      setTotalPending(queueRes.total_pending)
      setTotalVerified(queueRes.total_verified)
      setTotalOverridden(queueRes.total_overridden)
      setCategories(catRes.categories)
      setCurrentIndex(0)
    } finally {
      setLoading(false)
    }
  }, [maxConfidence])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleVerify(categoryId: number) {
    if (!currentItem || saving) return

    setSaving(true)
    const wasOverride = categoryId !== currentItem.category_id

    try {
      await submitVerification({
        extraction_id: currentItem.extraction_id,
        category_id:   categoryId,
      })

      if (wasOverride) setSessionCorrected(prev => prev + 1)
      else             setSessionVerified(prev => prev + 1)

      setTotalVerified(prev => prev + 1)
      setTotalPending(prev => Math.max(0, prev - 1))
      if (wasOverride) setTotalOverridden(prev => prev + 1)

      // Animate out, then advance
      setSlideDir('out')
      setTimeout(() => {
        setCorrecting(false)
        setSelectedCatId(null)
        setCurrentIndex(prev => prev + 1)
        setSlideDir('in')
        setTimeout(() => setSlideDir(null), 300)
      }, 250)
    } finally {
      setSaving(false)
    }
  }

  function handleSkip() {
    if (suppressSkipWarn) {
      doSkip()
    } else {
      setConfirmingSkip(true)
    }
  }

  function doSkip() {
    setConfirmingSkip(false)
    setSlideDir('out')
    setTimeout(() => {
      setCorrecting(false)
      setSelectedCatId(null)
      setCurrentIndex(prev => prev + 1)
      setSlideDir('in')
      setTimeout(() => setSlideDir(null), 300)
    }, 250)
  }

  function handleStartCorrection() {
    setCorrecting(true)
    setSelectedCatId(null)
  }

  function handleCancelCorrection() {
    setCorrecting(false)
    setSelectedCatId(null)
  }

  function handleThresholdChange(val: string) {
    setMaxConfidence(parseFloat(val))
    setCurrentIndex(0)
    setSessionVerified(0)
    setSessionCorrected(0)
  }

  const queueExhausted = !loading && currentIndex >= queue.length

  return (
    <>
      <Header title="Train the System" />

      <main className="page-content">
        {loading ? (
          <LoadingSpinner message="Loading training queue..." />
        ) : (
          <div className="training-layout">

            {/* ── Page header ───────────────────────────────── */}
            <div className="training-page-header">
              <GraduationCap size={22} className="training-page-icon" />
              <div>
                <h2>Classification Training</h2>
                <p>
                  Review low-confidence classifications to improve model accuracy over time.
                  Each correction feeds directly into future analysis runs.
                </p>
              </div>
            </div>

            {/* ── Intro banner ──────────────────────────────── */}
            {showIntro && (
              <div className="training-intro">
                <div className="training-intro-content">
                  <GraduationCap size={20} />
                  <div>
                    <strong>Help improve classification accuracy.</strong>
                    <span>
                      Review items where the AI was least confident. Confirm the category is correct
                      or pick a better one — your feedback trains the model for future analyses.
                    </span>
                  </div>
                </div>
                <button
                  className="training-intro-dismiss"
                  onClick={() => setShowIntro(false)}
                >
                  Got it
                </button>
              </div>
            )}

            {/* ── Stats bar ─────────────────────────────────── */}
            <div className="training-stats-bar">
              <div className="training-stat">
                <div className="training-stat-value">{totalPending}</div>
                <div className="training-stat-label">Pending review</div>
              </div>
              <div className="training-stat">
                <div className="training-stat-value">{totalVerified}</div>
                <div className="training-stat-label">Total verified</div>
              </div>
              <div className="training-stat">
                <div className="training-stat-value">
                  {accuracyRate ? `${accuracyRate}%` : '—'}
                </div>
                <div className="training-stat-label">Model accuracy</div>
              </div>
              <div className="training-stat session-stat">
                <div className="training-stat-value">
                  {sessionVerified + sessionCorrected}
                </div>
                <div className="training-stat-label">Reviewed this session</div>
              </div>
              <div className="training-stat-threshold">
                <div className="training-stat-label">Confidence threshold</div>
                <CustomSelect
                  options={CONFIDENCE_OPTIONS}
                  value={maxConfidence.toFixed(2)}
                  onChange={handleThresholdChange}
                />
              </div>
            </div>

            {/* ── Progress bar ──────────────────────────────── */}
            {queue.length > 0 && (
              <div className="training-progress">
                <div className="training-progress-track">
                  <div
                    className="training-progress-fill"
                    style={{ width: `${Math.min(100, (currentIndex / queue.length) * 100)}%` }}
                  />
                </div>
                <span className="training-progress-label">
                  {currentIndex} of {queue.length} in batch
                </span>
              </div>
            )}

            {/* ── Review card OR empty state ─────────────────── */}
            {queueExhausted ? (
              <AllCaughtUp
                totalVerified={totalVerified}
                accuracyRate={accuracyRate}
                sessionCount={sessionVerified + sessionCorrected}
                hasPending={totalPending > 0}
                onLoadMore={fetchData}
              />
            ) : currentItem ? (
              <div className={`training-card ${slideDir === 'out' ? 'slide-out' : slideDir === 'in' ? 'slide-in' : ''}`}>
                <div className="training-card-context">
                  <span className="training-card-erector">
                    {currentItem.erector_name ?? 'Unknown erector'}
                  </span>
                  <span className="training-card-separator">•</span>
                  <span className="training-card-job">
                    {currentItem.job_number ?? 'No job #'}
                    {currentItem.job_name ? ` — ${currentItem.job_name}` : ''}
                  </span>
                  <span className="training-card-separator">•</span>
                  <ConfidenceBadge value={currentItem.classification_confidence} />
                </div>

                <div className="training-card-text">
                  {currentItem.raw_text}
                </div>

                <div className="training-card-classification">
                  <span className="training-card-class-label">AI classified as:</span>
                  <span className="training-card-category">
                    {currentItem.category_name}
                  </span>
                </div>

                {!correcting && !confirmingSkip ? (
                  <div className="training-card-actions">
                    <button
                      className="training-btn confirm"
                      onClick={() => handleVerify(currentItem.category_id)}
                      disabled={saving}
                    >
                      <CheckCircle2 size={16} />
                      Correct
                    </button>
                    <button
                      className="training-btn correct"
                      onClick={handleStartCorrection}
                    >
                      <ArrowRight size={16} />
                      Wrong, Reassign
                    </button>
                    <button
                      className="training-btn skip"
                      onClick={handleSkip}
                    >
                      Skip
                    </button>
                  </div>
                ) : confirmingSkip ? (
                  <div className="training-skip-confirm">
                    <div className="training-skip-warn">
                      <AlertTriangle size={14} />
                      <span>Is there anyone you could ask about this one? Skipped items won't improve accuracy.</span>
                    </div>
                    <label className="training-skip-suppress">
                      <input
                        type="checkbox"
                        checked={suppressSkipWarn}
                        onChange={e => setSuppressSkipWarn(e.target.checked)}
                      />
                      Don't ask again this session
                    </label>
                    <div className="training-correction-btns">
                      <button className="training-btn skip" onClick={doSkip}>
                        Skip anyway
                      </button>
                      <button
                        className="training-btn confirm"
                        onClick={() => setConfirmingSkip(false)}
                      >
                        Go back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="training-card-correction">
                    <span className="training-correction-label">
                      Select the correct category:
                    </span>
                    <CustomSelect
                      options={categories
                        .filter(c => c.Id !== currentItem.category_id)
                        .map(c => ({ value: String(c.Id), label: c.Name }))}
                      value={selectedCatId ? String(selectedCatId) : ''}
                      onChange={v => setSelectedCatId(Number(v))}
                      placeholder="Choose category..."
                    />
                    <div className="training-correction-btns">
                      <button
                        className="training-btn confirm"
                        onClick={() => selectedCatId && handleVerify(selectedCatId)}
                        disabled={!selectedCatId || saving}
                      >
                        {saving ? 'Saving...' : 'Submit Correction'}
                      </button>
                      <button
                        className="training-btn skip"
                        onClick={handleCancelCorrection}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

          </div>
        )}
      </main>
    </>
  )
}


/* ── Confidence Badge ────────────────────────────────────────────── */

function ConfidenceBadge({ value }: { value: number }) {
  const pct   = (value * 100).toFixed(0)
  const level = value <= 0.5 ? 'critical' : value <= 0.65 ? 'low' : 'medium'

  return (
    <span className={`confidence-badge ${level}`}>
      <AlertTriangle size={11} />
      {pct}% confidence
    </span>
  )
}


/* ── All Caught Up ───────────────────────────────────────────────── */

interface AllCaughtUpProps {
  totalVerified: number
  accuracyRate:  string | null
  sessionCount:  number
  hasPending:    boolean
  onLoadMore:    () => void
}

function AllCaughtUp({ totalVerified, accuracyRate, sessionCount, hasPending, onLoadMore }: AllCaughtUpProps) {
  return (
    <div className="training-empty">
      <div className="training-empty-icon">
        {sessionCount > 0 ? <Trophy size={36} /> : <Sparkles size={36} />}
      </div>
      <h2>
        {sessionCount > 0 ? 'Great work!' : 'All caught up'}
      </h2>
      <p>
        {sessionCount > 0
          ? `You reviewed ${sessionCount} item${sessionCount !== 1 ? 's' : ''} this session.`
          : 'No items need review at this confidence threshold.'
        }
      </p>
      <div className="training-empty-stats">
        {accuracyRate && (
          <div className="training-empty-stat">
            <BarChart3 size={14} />
            {accuracyRate}% model accuracy
          </div>
        )}
        <div className="training-empty-stat">
          <CheckCircle2 size={14} />
          {totalVerified} total verified
        </div>
      </div>
      {hasPending && (
        <button className="training-btn confirm" style={{ marginTop: 16 }} onClick={onLoadMore}>
          Load more items
        </button>
      )}
    </div>
  )
}
