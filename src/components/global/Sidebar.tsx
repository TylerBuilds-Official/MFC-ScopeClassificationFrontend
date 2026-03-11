import { NavLink } from 'react-router-dom'
import { LayoutGrid, Search, AlertTriangle, GraduationCap, Upload, FileText, Shield, LogOut, GitCompareArrows } from 'lucide-react'
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

      <div className="sidebar-section-label">Tools</div>
      <nav className="sidebar-nav">
        <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <GitCompareArrows size={18} />
          Compare Erectors
        </NavLink>
        {user?.is_estimator && (
          <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Upload size={18} />
            Analyze PDF
          </NavLink>
        )}
      </nav>

      <div className="sidebar-section-label">Review</div>
      <nav className="sidebar-nav">
        <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={18} />
          Sessions
        </NavLink>
        {user?.is_estimator && (
          <NavLink to="/training" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <GraduationCap size={18} />
            Train
          </NavLink>
        )}
      </nav>

      <div className="sidebar-section-label">Reference</div>
      <nav className="sidebar-nav">
        <NavLink to="/exclusions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          MFC Exclusions
        </NavLink>
      </nav>

      {user?.is_admin && (
        <>
          <div className="sidebar-section-label">Insights</div>
          <nav className="sidebar-nav">
            <NavLink to="/high-risk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <AlertTriangle size={18} />
              Template Health
            </NavLink>
          </nav>

          <div className="sidebar-section-label">System</div>
          <nav className="sidebar-nav">
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              Admin
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
