import type { ErectorOnlyItem } from '../../types/editor'


interface Props {
  items: ErectorOnlyItem[]
}


export default function ErectorOnlyBlock({ items }: Props) {

  if (items.length === 0) return null

  return (
    <div className="erector-only-block">
      <div className="erector-only-header">
        Erector-Only Exclusions:
      </div>
      {items.map(item => (
        <div key={item.match_id} className="erector-only-item">
          <span className="erector-only-bullet">&bull;</span>
          <span className="erector-only-text">{item.text}</span>
          {item.risk_level && (item.risk_level === 'High' || item.risk_level === 'Critical') && (
            <span className={`erector-only-risk ${item.risk_level.toLowerCase()}`}>
              {item.risk_level}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
