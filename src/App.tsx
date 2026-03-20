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
import ScopeReviewsPage from './pages/ScopeReviewsPage'
import ScopeReviewDetailPage from './pages/ScopeReviewDetailPage'
import NewReviewPage from './pages/NewReviewPage'
import ComparisonsPage from './pages/ComparisonsPage'
import CompareNewPage from './pages/CompareNewPage'
import ComparisonDetailPage from './pages/ComparisonDetailPage'
import MappingPage from './pages/MappingPage'


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
        {/* Estimator tools */}
        <Route path="/compare"         element={<ComparisonsPage />} />
        <Route path="/compare/new"     element={isEstimator ? <CompareNewPage /> : <Navigate to="/reviews" replace />} />
        <Route path="/compare/:id"     element={<ComparisonDetailPage />} />
        <Route path="/reviews"         element={<ScopeReviewsPage />} />
        <Route path="/reviews/new"     element={isEstimator ? <NewReviewPage /> : <Navigate to="/reviews" replace />} />
        <Route path="/reviews/:id"         element={<ScopeReviewDetailPage />} />
        <Route path="/reviews/:id/editor"  element={<ScopeLetterEditorPage />} />
        <Route path="/analyze"         element={isAdmin ? <AnalyzePage /> : <Navigate to="/reviews" replace />} />
        <Route path="/exclusions"      element={<ExclusionsPage />} />
        <Route path="/training"        element={isAdmin ? <TrainingPage /> : <Navigate to="/reviews" replace />} />

        {/* Admin views — raw data + risk */}
        <Route path="/sessions"            element={isAdmin ? <SessionsPage />         : <Navigate to="/reviews" replace />} />
        <Route path="/sessions/:id"        element={isAdmin ? <SessionDetailPage />   : <Navigate to="/reviews" replace />} />
        {/* Legacy redirect — editor now lives under /reviews */}
        <Route path="/sessions/:id/editor" element={<Navigate to="/reviews" replace />} />
        <Route path="/high-risk"              element={isAdmin ? <HighRiskPage />        : <Navigate to="/reviews" replace />} />
        <Route path="/high-risk/session/:id"  element={isAdmin ? <HighRiskSessionPage /> : <Navigate to="/reviews" replace />} />
        <Route path="/mapping"             element={isAdmin ? <MappingPage />           : <Navigate to="/reviews" replace />} />
        <Route path="/admin"               element={isAdmin ? <AdminPage />            : <Navigate to="/reviews" replace />} />

        <Route path="/auth/callback" element={<Navigate to="/reviews" replace />} />
        <Route path="*"             element={<Navigate to="/reviews" replace />} />
      </Routes>

      <ProgressToast />
    </div>
  )
}
