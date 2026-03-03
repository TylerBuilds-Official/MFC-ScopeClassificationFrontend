import { NavLink } from 'react-router-dom'
import { LayoutGrid, Search, AlertTriangle, GraduationCap, Upload, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../../auth'

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Search size={16} />
        </div>
        <h1>Scope Analysis</h1>
      </div>

      <div className="sidebar-section-label">Views</div>
      <nav className="sidebar-nav">
        <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={18} />
          Sessions
        </NavLink>
        <NavLink to="/high-risk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          High Risk
        </NavLink>
        {user?.is_estimator && (
          <NavLink to="/training" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <GraduationCap size={18} />
            Train
          </NavLink>
        )}
      </nav>

      <div className="sidebar-section-label">Manage</div>
      <nav className="sidebar-nav">
        <NavLink to="/exclusions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          MFC Exclusions
        </NavLink>
      </nav>

      {user?.is_estimator && (
        <>
          <div className="sidebar-section-label">Actions</div>
          <nav className="sidebar-nav">
            <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Upload size={18} />
              Analyze PDF
            </NavLink>
          </nav>
        </>
      )}

      {/* ── User footer ─────────────────────────────────── */}
      <div className="sidebar-spacer" />
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.display_name}</span>
            <span className="sidebar-user-role">{user.role}</span>
          </div>
          <button className="sidebar-sign-out" onClick={logout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  )
}
