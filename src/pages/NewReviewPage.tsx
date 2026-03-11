import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import Header from '../components/global/Header'
import AnalyzeForm from '../components/analysis/AnalyzeForm'
import type { AnalyzeFormData } from '../components/analysis/AnalyzeForm'
import { analyzeScope } from '../api/analyze'
import { useRunningSessions } from '../hooks/useRunningSessions'

import '../styles/analyze.css'


export default function NewReviewPage() {
  const navigate      = useNavigate()
  const { track }     = useRunningSessions()

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(data: AnalyzeFormData) {
    setLoading(true)
    setError(null)

    try {
      const res = await analyzeScope({
        networkPath: data.networkPath || undefined,
        erectorName: data.erectorName || undefined,
        jobNumber:   data.jobNumber   || undefined,
        jobName:     data.jobName     || undefined,
        initiatedBy: data.initiatedBy || undefined,
        file:        data.file ?? undefined,
      })

      track(res.session_id)
      navigate(`/reviews/${res.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch analysis')
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="New Scope Review">
        <button
          className="btn-analyze"
          style={{ padding: '6px 14px', fontSize: '12.5px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          onClick={() => navigate('/reviews')}
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </Header>

      <main className="page-content">
        <div className="page-header">
          <h2>Analyze Erector Scope Letter</h2>
        </div>

        <AnalyzeForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="compare-error" style={{ marginTop: 20, maxWidth: 640 }}>
            {error}
          </div>
        )}
      </main>
    </>
  )
}
