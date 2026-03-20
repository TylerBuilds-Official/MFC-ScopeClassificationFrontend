import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, Search, AlertTriangle, GraduationCap,
  FileText, Shield, LogOut, GitCompareArrows, FileCheck, Link2,
} from 'lucide-react'
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

      {/* ── Estimator tools ──────────────────────────────── */}
      <div className="sidebar-section-label">Tools</div>
      <nav className="sidebar-nav">
        <NavLink to="/compare" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <GitCompareArrows size={18} />
          Compare Erectors
        </NavLink>
        <NavLink to="/reviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileCheck size={18} />
          Erector vs MFC
        </NavLink>
      </nav>

      <div className="sidebar-section-label">Reference</div>
      <nav className="sidebar-nav">
        <NavLink to="/exclusions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          MFC Exclusions
        </NavLink>
      </nav>

      {/* ── Admin views ──────────────────────────────────── */}
      {user?.is_admin && (
        <>
          <div className="sidebar-section-label">Admin</div>
          <nav className="sidebar-nav">
            <NavLink to="/mapping" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Link2 size={18} />
              Erector Mapping
            </NavLink>
            <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <LayoutGrid size={18} />
              Sessions
            </NavLink>
            <NavLink to="/high-risk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <AlertTriangle size={18} />
              High Risk
            </NavLink>
            <NavLink to="/training" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <GraduationCap size={18} />
              Train
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              Users
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
