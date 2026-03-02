export interface Category {
  Id:          number
  Name:        string
  Description: string
  SortOrder:   number
}

export interface CategoryListResponse {
  categories: Category[]
  count:      number
}

export interface HeatmapCell {
  category_id:   number
  category_name: string
  MatchType:     string
  cnt:           number
}

export interface HeatmapResponse {
  data: HeatmapCell[]
}
