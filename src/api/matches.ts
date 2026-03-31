import { get, patch } from './client'
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


export interface ValidateMatchResponse {
  match_id:      number
  match_type:    string
  previous_type: string
  reviewed_by:   string
}


export async function validateMatch(
  matchId:   number,
  matchType: string ): Promise<ValidateMatchResponse> {

  return patch<ValidateMatchResponse>(`/matches/${matchId}/validate`, {
    match_type: matchType,
  })
}
