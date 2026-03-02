import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/global/Header'
import AnalyzeForm from '../components/analysis/AnalyzeForm'
import type { AnalyzeFormData } from '../components/analysis/AnalyzeForm'
import { analyzeScope } from '../api/analyze'
import { useRunningSessions } from '../hooks/useRunningSessions'

import '../styles/analyze.css'


export default function AnalyzePage() {
  const navigate = useNavigate()
  const { track } = useRunningSessions()

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

      // Track for toast + navigate to session detail
      track(res.session_id)
      navigate(`/sessions/${res.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch analysis')
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Analyze Scope Letter" />

      <main className="page-content">
        <div className="page-header">
          <h2>Run Analysis</h2>
        </div>

        <AnalyzeForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div
            style={{
              marginTop:    20,
              maxWidth:     640,
              padding:      '12px 16px',
              background:   'rgba(248, 113, 113, 0.08)',
              border:       '1px solid rgba(248, 113, 113, 0.2)',
              borderRadius: 'var(--radius-md)',
              color:        'var(--status-error)',
              fontSize:     '13px',
            }}
          >
            {error}
          </div>
        )}
      </main>
    </>
  )
}
