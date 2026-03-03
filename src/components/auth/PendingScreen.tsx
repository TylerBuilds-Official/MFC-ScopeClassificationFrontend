import { Clock, LogOut } from 'lucide-react'
import { useAuth } from '../../auth'


export default function PendingScreen() {
  const { user, logout } = useAuth()

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-pending-icon">
          <Clock size={32} />
        </div>

        <h2>Account Pending Activation</h2>
        <p>
          Hey {user?.display_name?.split(' ')[0] ?? 'there'}, your account has been created
          but an administrator needs to activate it before you can access the system.
        </p>
        <p className="auth-pending-hint">
          Contact Tyler or your IT team to get activated.
        </p>

        <button className="auth-sign-out" onClick={logout}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}
