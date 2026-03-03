import { get, post } from './client'
import type { TrainingQueueResponse, TrainingStatsResponse, TrainingVerifyResult } from '../types/training'


export async function getTrainingQueue(params?: {
  max_confidence?: number
  limit?:          number
  offset?:         number
}): Promise<TrainingQueueResponse> {

  return get<TrainingQueueResponse>('/training/queue', params)
}


export async function submitVerification(data: {
  extraction_id: number
  category_id:   number
  verified_by?:  string
}): Promise<TrainingVerifyResult> {

  return post<TrainingVerifyResult>('/training/verify', data)
}


export async function getTrainingStats(params?: {
  max_confidence?: number
}): Promise<TrainingStatsResponse> {

  return get<TrainingStatsResponse>('/training/stats', params)
}
