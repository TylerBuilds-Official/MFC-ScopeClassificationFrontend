const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Complete:   { bg: 'rgba(52, 211, 153, 0.12)',  color: 'var(--status-complete)' },
  Classified: { bg: 'rgba(78, 140, 255, 0.12)',  color: 'var(--accent)' },
  Extracted:  { bg: 'rgba(251, 191, 36, 0.12)',  color: 'var(--status-running)' },
  Ingested:   { bg: 'rgba(148, 153, 171, 0.12)', color: 'var(--status-pending)' },
  Error:      { bg: 'rgba(248, 113, 113, 0.12)', color: 'var(--status-error)' },
}

interface StatusBadgeProps {
  status: string | null
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = status ?? 'Unknown'
  const style = STATUS_STYLES[label] ?? STATUS_STYLES.Ingested

  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        padding:       '2px 10px',
        borderRadius:  '999px',
        fontSize:      '11.5px',
        fontWeight:    600,
        letterSpacing: '0.02em',
        background:    style.bg,
        color:         style.color,
      }}
    >
      {label}
    </span>
  )
}
