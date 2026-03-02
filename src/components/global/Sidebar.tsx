import { NavLink } from 'react-router-dom'
import { LayoutGrid, Search, AlertTriangle, Grid3X3, Upload, FileText } from 'lucide-react'

export default function Sidebar() {
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
        <NavLink to="/heatmap" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Grid3X3 size={18} />
          Heatmap
        </NavLink>
      </nav>

      <div className="sidebar-section-label">Manage</div>
      <nav className="sidebar-nav">
        <NavLink to="/exclusions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          MFC Exclusions
        </NavLink>
      </nav>

      <div className="sidebar-section-label">Actions</div>
      <nav className="sidebar-nav">
        <NavLink to="/analyze" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Upload size={18} />
          Analyze PDF
        </NavLink>
      </nav>
    </aside>
  )
}
