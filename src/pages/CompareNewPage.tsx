import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Plus, ArrowLeft } from 'lucide-react'

import Header from '../components/global/Header'
import { createComparisonFromUploads } from '../api/comparison'

import '../styles/comparison.css'


interface ErectorEntry {
  file:         File
  erectorName:  string
}


export default function CompareNewPage() {
  const navigate  = useNavigate()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [entries, setEntries]       = useState<ErectorEntry[]>([])
  const [jobNumber, setJobNumber]   = useState('')
  const [jobName, setJobName]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return

    const newEntries: ErectorEntry[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (!file.name.toLowerCase().endsWith('.pdf')) continue

      // Auto-guess erector name from filename
      const baseName   = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ')
      const guessName  = baseName.length > 40 ? '' : baseName

      newEntries.push({ file, erectorName: guessName })
    }

    setEntries(prev => [...prev, ...newEntries])

    // Reset input so the same files can be re-added
    if (fileRef.current) fileRef.current.value = ''
  }

  function updateErectorName(index: number, name: string) {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, erectorName: name } : e))
  }

  function removeEntry(index: number) {
    setEntries(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    const emptyNames = entries.filter(e => !e.erectorName.trim())
    if (emptyNames.length > 0) {
      setError('Every scope letter needs an erector name')
      return
    }

    if (entries.length < 2) {
      setError('Need at least 2 scope letters to compare')
      return
    }

    if (entries.length > 15) {
      setError('Maximum 15 scope letters per comparison')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await createComparisonFromUploads(
        entries.map(e => e.file),
        entries.map(e => e.erectorName.trim()),
        jobNumber.trim() || undefined,
        jobName.trim() || undefined,
      )

      navigate(`/compare/${res.comparison_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch comparison')
      setLoading(false)
    }
  }

  const canSubmit = entries.length >= 2 && entries.every(e => e.erectorName.trim()) && !loading

  return (
    <>
      <Header title="New Comparison">
        <button className="btn-analyze secondary" onClick={() => navigate('/compare')}>
          <ArrowLeft size={14} />
          Back
        </button>
      </Header>

      <main className="page-content">
        <div className="compare-new-form">

          {/* Job info */}
          <div className="compare-section">
            <h3 className="compare-section-label">Job Info</h3>
            <div className="compare-field-row">
              <div className="compare-field">
                <label>Job Number</label>
                <input
                  type="text"
                  value={jobNumber}
                  onChange={e => setJobNumber(e.target.value)}
                  placeholder="e.g. 26-042"
                  className="field-input"
                />
              </div>
              <div className="compare-field" style={{ flex: 2 }}>
                <label>Job Name</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  placeholder="e.g. Spokane Medical Tower"
                  className="field-input"
                />
              </div>
            </div>
          </div>

          {/* Scope letters */}
          <div className="compare-section">
            <h3 className="compare-section-label">
              Scope Letters
              <span className="compare-count">{entries.length} / 15</span>
            </h3>

            {entries.length === 0 && (
              <div className="compare-empty-drop">
                <Upload size={24} />
                <p>Drop scope letter PDFs here or click to browse</p>
                <p className="compare-empty-sub">Minimum 2 scope letters required</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={e => handleFilesSelected(e.target.files)}
                  className="compare-file-input"
                />
              </div>
            )}

            {entries.length > 0 && (
              <div className="compare-entries">
                {entries.map((entry, i) => (
                  <div key={i} className="compare-entry">
                    <div className="compare-entry-file">
                      <span className="compare-entry-index">{i + 1}</span>
                      <span className="compare-entry-name" title={entry.file.name}>
                        {entry.file.name}
                      </span>
                      <span className="compare-entry-size">
                        {(entry.file.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <div className="compare-entry-erector">
                      <input
                        type="text"
                        value={entry.erectorName}
                        onChange={e => updateErectorName(i, e.target.value)}
                        placeholder="Erector name (required)"
                        className="field-input"
                      />
                    </div>
                    <button
                      className="compare-entry-remove"
                      onClick={() => removeEntry(i)}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {entries.length < 15 && (
                  <button
                    className="compare-add-more"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Plus size={14} />
                    Add more scope letters
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={e => handleFilesSelected(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="compare-error">{error}</div>
          )}

          {/* Submit */}
          <button
            className="btn-analyze compare-submit"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? 'Analyzing...' : `Compare ${entries.length} Erectors`}
          </button>
        </div>
      </main>
    </>
  )
}
