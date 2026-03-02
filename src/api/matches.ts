import { get } from './client'
import type { MatchListResponse, HighRiskResponse } from '../types/match'


export async function getSessionMatches(
  sessionId:   number,
  risk?:       string,
  categoryId?: number ): Promise<MatchListResponse> {

  const params: Record<string, string | number> = {}
  if (risk)       params.risk        = risk
  if (categoryId) params.category_id = categoryId

  return get<MatchListResponse>(`/matches/session/${sessionId}`, params)
}


export async function getHighRisk(limit = 100): Promise<HighRiskResponse> {

  return get<HighRiskResponse>('/matches/high-risk', { limit })
}
