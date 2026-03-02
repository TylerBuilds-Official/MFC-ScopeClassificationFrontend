import { useMemo } from 'react'

import { useApi } from './useApi'
import { getCategories } from '../api/categories'


/**
 * Fetches categories once and returns an id → name lookup map.
 */
export function useCategories(): {
  categoryMap: Map<number, string>
  loading:     boolean
} {
  const { data, loading } = useApi(() => getCategories(), [])

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>()

    for (const cat of data?.categories ?? []) {
      map.set(cat.Id, cat.Name)
    }

    return map
  }, [data])

  return { categoryMap, loading }
}
