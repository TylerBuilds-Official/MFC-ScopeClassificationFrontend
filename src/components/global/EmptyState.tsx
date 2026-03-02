import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title:    string
  message?: string
  icon?:    React.ReactNode
}

export default function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '64px 24px',
        color:          'var(--text-muted)',
        textAlign:      'center',
      }}
    >
      <div style={{ marginBottom: '12px', opacity: 0.5 }}>
        {icon ?? <Inbox size={36} />}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {title}
      </div>
      {message && (
        <div style={{ fontSize: '13px', maxWidth: '320px' }}>{message}</div>
      )}
    </div>
  )
}
