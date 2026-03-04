interface RiskBadgeProps {
  level: string | null
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  if (!level) return null

  const cls = level.toLowerCase()

  return (
    <span className={`risk-badge risk-badge--${cls}`}>
      {level}
    </span>
  )
}
