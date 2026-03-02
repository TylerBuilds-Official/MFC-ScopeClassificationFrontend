const RISK_STYLES: Record<string, { bg: string; color: string }> = {
  Critical: { bg: 'rgba(239, 68, 68, 0.12)',  color: 'var(--risk-critical)' },
  High:     { bg: 'rgba(249, 115, 22, 0.12)', color: 'var(--risk-high)' },
  Medium:   { bg: 'rgba(234, 179, 8, 0.12)',  color: 'var(--risk-medium)' },
  Low:      { bg: 'rgba(34, 197, 94, 0.12)',  color: 'var(--risk-low)' },
}

interface RiskBadgeProps {
  level: string | null
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  if (!level) return null

  const style = RISK_STYLES[level] ?? RISK_STYLES.Low

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
      {level}
    </span>
  )
}
