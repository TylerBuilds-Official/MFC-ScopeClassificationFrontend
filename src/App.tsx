import { Routes, Route, Navigate } from 'react-router-dom'

import Sidebar from './components/global/Sidebar'
import ProgressToast from './components/global/ProgressToast'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import HighRiskPage from './pages/HighRiskPage'
import HighRiskSessionPage from './pages/HighRiskSessionPage'
import ExclusionsPage from './pages/ExclusionsPage'
import HeatmapPage from './pages/HeatmapPage'
import AnalyzePage from './pages/AnalyzePage'


export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <Routes>
        <Route path="/sessions"     element={<SessionsPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/high-risk"              element={<HighRiskPage />} />
        <Route path="/high-risk/session/:id"  element={<HighRiskSessionPage />} />
        <Route path="/exclusions"    element={<ExclusionsPage />} />
        <Route path="/heatmap"      element={<HeatmapPage />} />
        <Route path="/analyze"      element={<AnalyzePage />} />
        <Route path="*"             element={<Navigate to="/sessions" replace />} />
      </Routes>

      <ProgressToast />
    </div>
  )
}
