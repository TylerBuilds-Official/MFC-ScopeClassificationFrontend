import { Routes, Route, Navigate } from 'react-router-dom'

import { useAuth } from './auth'
import Sidebar from './components/global/Sidebar'
import ProgressToast from './components/global/ProgressToast'
import LoginScreen from './components/auth/LoginScreen'
import PendingScreen from './components/auth/PendingScreen'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import HighRiskPage from './pages/HighRiskPage'
import HighRiskSessionPage from './pages/HighRiskSessionPage'
import ExclusionsPage from './pages/ExclusionsPage'
import TrainingPage from './pages/TrainingPage'
import AnalyzePage from './pages/AnalyzePage'
import AdminPage from './pages/AdminPage'
import ScopeLetterEditorPage from './pages/ScopeLetterEditorPage'
import ComparisonsPage from './pages/ComparisonsPage'
import CompareNewPage from './pages/CompareNewPage'
import ComparisonDetailPage from './pages/ComparisonDetailPage'


export default function App() {
  const { user, isAuthenticated, isPendingActivation, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span>Authenticating...</span>
      </div>
    )
  }

  if (!isAuthenticated && !isPendingActivation) {
    return <LoginScreen />
  }

  if (isPendingActivation) {
    return <PendingScreen />
  }

  const isEstimator = user?.is_estimator ?? false
  const isAdmin     = user?.is_admin ?? false

  return (
    <div className="app-layout">
      <Sidebar />

      <Routes>
        <Route path="/compare"         element={<ComparisonsPage />} />
        <Route path="/compare/new"     element={isEstimator ? <CompareNewPage /> : <Navigate to="/compare" replace />} />
        <Route path="/compare/:id"     element={<ComparisonDetailPage />} />
        <Route path="/sessions"     element={<SessionsPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route path="/sessions/:id/editor" element={<ScopeLetterEditorPage />} />
        <Route path="/high-risk"              element={<HighRiskPage />} />
        <Route path="/high-risk/session/:id"  element={<HighRiskSessionPage />} />
        <Route path="/exclusions"    element={<ExclusionsPage />} />
        <Route path="/training"     element={isEstimator ? <TrainingPage />  : <Navigate to="/sessions" replace />} />
        <Route path="/analyze"      element={isEstimator ? <AnalyzePage />   : <Navigate to="/sessions" replace />} />
        <Route path="/admin"        element={isAdmin     ? <AdminPage />     : <Navigate to="/sessions" replace />} />
        <Route path="/auth/callback" element={<Navigate to="/sessions" replace />} />
        <Route path="*"             element={<Navigate to="/sessions" replace />} />
      </Routes>

      <ProgressToast />
    </div>
  )
}
