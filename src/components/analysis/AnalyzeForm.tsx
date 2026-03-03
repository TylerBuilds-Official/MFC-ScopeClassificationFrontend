import { useState, useRef, type DragEvent } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { useAuth } from '../../auth'


export interface AnalyzeFormData {
  networkPath: string
  erectorName: string
  jobNumber:   string
  jobName:     string
  initiatedBy: string
  file:        File | null
}


interface AnalyzeFormProps {
  onSubmit:  (data: AnalyzeFormData) => void
  loading:   boolean
}


export default function AnalyzeForm({ onSubmit, loading }: AnalyzeFormProps) {
  const { user } = useAuth()

  const [networkPath, setNetworkPath] = useState('')
  const [erectorName, setErectorName] = useState('')
  const [jobNumber, setJobNumber]     = useState('')
  const [jobName, setJobName]         = useState('')
  const [file, setFile]               = useState<File | null>(null)
  const [dragOver, setDragOver]       = useState(false)

  const initiatedBy = user?.display_name ?? ''

  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit() {
    if (!networkPath && !file) return

    onSubmit({ networkPath, erectorName, jobNumber, jobName, initiatedBy, file })
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)

    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.toLowerCase().endsWith('.pdf')) {
      setFile(dropped)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const hasInput = networkPath.trim() || file

  return (
    <div className="analyze-form">
      {/* Network path */}
      <div className="form-group">
        <label>Network / Local Path</label>
        <input
          type="text"
          value={networkPath}
          onChange={e => setNetworkPath(e.target.value)}
          placeholder="\\10.0.15.1\...\scope_letter.pdf"
          disabled={loading}
        />
        <div className="hint">UNC or local path accessible from the server</div>
      </div>

      <div className="form-divider">or upload</div>

      {/* File upload */}
      <div className="form-group">
        <div
          className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload />
          <div className="drop-text">Drop a PDF here or click to browse</div>
          <div className="drop-hint">Only .pdf files accepted</div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {file && (
          <div className="file-selected">
            <FileText size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span className="file-name">{file.name}</span>
            <button
              className="file-remove"
              onClick={() => setFile(null)}
              disabled={loading}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label>Erector Name</label>
          <input
            type="text"
            value={erectorName}
            onChange={e => setErectorName(e.target.value)}
            placeholder="e.g. Superior Steel"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Job Number</label>
          <input
            type="text"
            value={jobNumber}
            onChange={e => setJobNumber(e.target.value)}
            placeholder="e.g. 24001"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Job Name</label>
          <input
            type="text"
            value={jobName}
            onChange={e => setJobName(e.target.value)}
            placeholder="Optional"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Initiated By</label>
          <input
            type="text"
            value={initiatedBy}
            readOnly
            className="readonly-field"
          />
        </div>
      </div>

      <button
        className="btn-analyze"
        onClick={handleSubmit}
        disabled={loading || !hasInput}
      >
        {loading ? 'Analyzing...' : 'Run Analysis'}
      </button>
    </div>
  )
}
