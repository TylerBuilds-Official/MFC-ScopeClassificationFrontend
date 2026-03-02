import { get, post, put, del_ } from './client'
import type { Category, CategoryListResponse, HeatmapResponse } from '../types/category'


export async function getCategories(): Promise<CategoryListResponse> {

  return get<CategoryListResponse>('/categories')
}


export async function getHeatmap(): Promise<HeatmapResponse> {

  return get<HeatmapResponse>('/categories/heatmap')
}


export async function createCategory(data: {
  name:         string
  description?: string
  sort_order?:  number
}): Promise<Category> {

  return post<Category>('/categories', data)
}


export async function updateCategory(id: number, data: {
  name?:        string
  description?: string
  sort_order?:  number
}): Promise<Category> {

  return put<Category>(`/categories/${id}`, data)
}


export async function deleteCategory(id: number): Promise<{ deleted: number }> {

  return del_<{ deleted: number }>(`/categories/${id}`)
}
