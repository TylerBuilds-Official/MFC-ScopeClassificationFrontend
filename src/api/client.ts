const BASE_URL = '/api'


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


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }))
    throw new ApiError(response.status, body.detail ?? response.statusText)
  }

  return response.json()
}


export async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    })
  }

  const response = await fetch(url.toString())

  return handleResponse<T>(response)
}


export async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  return handleResponse<T>(response)
}


export async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  return handleResponse<T>(response)
}


export async function del_<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' })

  return handleResponse<T>(response)
}


export async function post<T>(path: string, body: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = body instanceof FormData

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body:    isFormData ? body : JSON.stringify(body),
  })

  return handleResponse<T>(response)
}
