import { msalInstance } from '../auth/msalInstance'
import { apiTokenRequest } from '../auth/authConfig'


const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'


export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name   = 'ApiError'
    this.status = status
    this.detail = detail
  }
}


async function getAuthHeaders(): Promise<Record<string, string>> {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) return {}

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...apiTokenRequest,
      account: accounts[0],
    })

    return { Authorization: `Bearer ${response.accessToken}` }
  } catch {
    console.warn('[client] Silent token acquisition failed — request will be unauthenticated')

    return {}
  }
}


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }))
    throw new ApiError(response.status, body.detail ?? response.statusText)
  }

  return response.json()
}


export async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url  = new URL(`${BASE_URL}${path}`, window.location.origin)
  const auth = await getAuthHeaders()

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    })
  }

  const response = await fetch(url.toString(), {
    headers: { ...auth },
  })

  return handleResponse<T>(response)
}


export async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const auth     = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', ...auth },
    body:    JSON.stringify(body),
  })

  return handleResponse<T>(response)
}


export async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const auth     = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body:    JSON.stringify(body),
  })

  return handleResponse<T>(response)
}


export async function del_<T>(path: string): Promise<T> {
  const auth     = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'DELETE',
    headers: { ...auth },
  })

  return handleResponse<T>(response)
}


export async function post<T>(path: string, body: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = body instanceof FormData
  const auth       = await getAuthHeaders()

  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'POST',
    headers: isFormData ? { ...auth } : { 'Content-Type': 'application/json', ...auth },
    body:    isFormData ? body : JSON.stringify(body),
  })

  return handleResponse<T>(response)
}
