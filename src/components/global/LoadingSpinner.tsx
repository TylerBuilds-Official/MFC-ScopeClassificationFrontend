export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '48px 24px',
        color:          'var(--text-muted)',
        gap:            '12px',
      }}
    >
      <div
        style={{
          width:        '28px',
          height:       '28px',
          border:       '3px solid var(--border-subtle)',
          borderTop:    '3px solid var(--accent)',
          borderRadius: '50%',
          animation:    'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '13px' }}>{message}</span>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
