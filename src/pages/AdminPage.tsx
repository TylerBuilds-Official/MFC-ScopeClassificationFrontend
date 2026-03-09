import { useState, useCallback } from 'react'
import { Shield, UserCheck, Clock, AlertTriangle } from 'lucide-react'

import Header from '../components/global/Header'
import LoadingSpinner from '../components/global/LoadingSpinner'
import EmptyState from '../components/global/EmptyState'
import CustomSelect from '../components/global/CustomSelect'
import ConfirmDialog from '../components/global/ConfirmDialog'
import { useApi } from '../hooks/useApi'
import { getUsers, setUserRole } from '../api/admin'
import type { AdminUser } from '../api/admin'

import '../styles/admin.css'


const ROLE_OPTIONS = [
  { value: 'pending',   label: 'Pending' },
  { value: 'viewer',    label: 'Viewer' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'admin',     label: 'Admin' },
]

const ROLE_BADGE_CLASS: Record<string, string> = {
  pending:   'role-pending',
  viewer:    'role-viewer',
  estimator: 'role-estimator',
  admin:     'role-admin',
}


interface RoleChangeState {
  user:    AdminUser
  newRole: string
}


export default function AdminPage() {
  const { data, loading, error, refetch } = useApi(() => getUsers(), [])

  const [roleChange, setRoleChange]   = useState<RoleChangeState | null>(null)
  const [saving, setSaving]           = useState(false)

  const users = data?.users ?? []

  const pendingCount   = users.filter(u => u.role === 'pending').length
  const activeCount    = users.filter(u => u.role !== 'pending').length

  const handleRoleSelect = useCallback((user: AdminUser, newRole: string) => {
    if (newRole === user.role) return

    setRoleChange({ user, newRole })
  }, [])

  const confirmRoleChange = useCallback(async () => {
    if (!roleChange) return

    setSaving(true)
    try {
      await setUserRole(roleChange.user.id, roleChange.newRole)
      setRoleChange(null)
      refetch()
    } catch (err) {
      console.error('Failed to update role:', err)
    } finally {
      setSaving(false)
    }
  }, [roleChange, refetch])

  return (
    <>
      <Header title="Admin" />

      <main className="page-content">
        {loading && <LoadingSpinner message="Loading users..." />}
        {error && <EmptyState title="Error" message={error} />}

        {!loading && !error && (
          <div className="admin-layout">

            {/* Stats */}
            <div className="admin-stats">
              <div className="admin-stat">
                <UserCheck size={16} />
                <span className="admin-stat-value">{activeCount}</span>
                <span className="admin-stat-label">Active users</span>
              </div>
              {pendingCount > 0 && (
                <div className="admin-stat pending">
                  <Clock size={16} />
                  <span className="admin-stat-value">{pendingCount}</span>
                  <span className="admin-stat-label">Pending activation</span>
                </div>
              )}
            </div>

            {/* Pending users section */}
            {pendingCount > 0 && (
              <div className="admin-section">
                <div className="admin-section-header">
                  <AlertTriangle size={15} className="admin-pending-icon" />
                  <h3>Pending Activation</h3>
                  <span className="admin-section-count">{pendingCount}</span>
                </div>
                <div className="admin-user-list">
                  {users.filter(u => u.role === 'pending').map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onRoleChange={handleRoleSelect}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active users section */}
            <div className="admin-section">
              <div className="admin-section-header">
                <Shield size={15} />
                <h3>All Users</h3>
                <span className="admin-section-count">{activeCount}</span>
              </div>
              <div className="admin-user-list">
                {users.filter(u => u.role !== 'pending').map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={handleRoleSelect}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        <ConfirmDialog
          open={roleChange !== null}
          title="Change User Role?"
          message={roleChange
            ? `Change ${roleChange.user.display_name} (${roleChange.user.email}) from "${roleChange.user.role}" to "${roleChange.newRole}"?`
            : ''}
          confirmLabel={saving ? 'Saving...' : 'Confirm'}
          variant="danger"
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleChange(null)}
        />
      </main>
    </>
  )
}


/* ── User Row ────────────────────────────────────────────────────── */

interface UserRowProps {
  user:         AdminUser
  onRoleChange: (user: AdminUser, role: string) => void
}

function UserRow({ user, onRoleChange }: UserRowProps) {
  const lastLogin = user.last_login_at
    ? new Date(user.last_login_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Never'

  const created = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'

  return (
    <div className={`admin-user-row ${user.role === 'pending' ? 'pending' : ''}`}>
      <div className="admin-user-info">
        <div className="admin-user-name">{user.display_name}</div>
        <div className="admin-user-email">{user.email}</div>
      </div>

      <div className="admin-user-meta">
        <span className="admin-user-date" title="Last login">
          {lastLogin}
        </span>
        <span className="admin-user-date muted" title={`Joined ${created}`}>
          Joined {created}
        </span>
      </div>

      <div className="admin-user-role">
        <CustomSelect
          options={ROLE_OPTIONS}
          value={user.role}
          onChange={v => onRoleChange(user, v)}
        />
      </div>
    </div>
  )
}
