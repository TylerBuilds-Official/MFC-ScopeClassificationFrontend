import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import MatchTable from './MatchTable'
import type { MatchRow } from '../../types/match.ts'


interface CategoryAccordionProps {
  matches:      MatchRow[]
  categoryMap?: Map<number, string>
}


interface CategoryGroup {
  categoryId: number | null
  label:      string
  matches:    MatchRow[]
}


export default function CategoryAccordion({ matches, categoryMap }: CategoryAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<number | null>>(new Set())

  const groups = groupByCategory(matches, categoryMap)

  function toggle(id: number | null) {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)

      return next
    })
  }

  return (
    <div>
      {groups.map(g => {
        const isOpen = openIds.has(g.categoryId)

        return (
          <div key={g.categoryId ?? 'none'} className="category-group">
            <div
              className="category-group-header"
              onClick={() => toggle(g.categoryId)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <h3>{g.label}</h3>
              </div>
              <span className="count-badge">{g.matches.length}</span>
            </div>

            {isOpen && (
              <div className="category-group-body">
                <MatchTable matches={g.matches} categoryMap={categoryMap} showCategory={false} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


function groupByCategory(matches: MatchRow[], categoryMap?: Map<number, string>): CategoryGroup[] {
  const map = new Map<number | null, MatchRow[]>()

  for (const m of matches) {
    const key = m.category_id
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => (a ?? 999) - (b ?? 999))
    .map(([id, rows]) => ({
      categoryId: id,
      label:      id != null ? (categoryMap?.get(id) ?? `Category ${id}`) : 'Uncategorized',
      matches:    rows,
    }))
}
