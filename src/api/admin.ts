import { get, patch } from './client'


export interface AdminUser {
  id:              number
  azure_object_id: string
  email:           string
  display_name:    string
  role:            string
  created_at:      string | null
  last_login_at:   string | null
}

interface AdminUserListResponse {
  users: AdminUser[]
  count: number
}

interface RoleUpdateResponse {
  user_id:  number
  old_role: string
  new_role: string
}


export async function getUsers(): Promise<AdminUserListResponse> {
  return get<AdminUserListResponse>('/admin/users')
}


export async function setUserRole(userId: number, role: string): Promise<RoleUpdateResponse> {
  return patch<RoleUpdateResponse>(`/admin/users/${userId}/role`, { role })
}
