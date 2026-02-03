import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import BlockedUsersPage from './pages/BlockedUsersPage'
import RegisterPage from './pages/RegisterPage'
import SignalementCreatePage from './pages/SignalementCreatePage'
import SignalementDetailPage from './pages/SignalementDetailPage'
import MainDashboard from './pages/MainDashboard'
import UserManagementPage from './pages/UserManagementPage'
import LandingPage from './pages/LandingPage'
import ManagerLoginPage from './pages/ManagerLoginPage'
import VisitorPage from './pages/VisitorPage'

function App() {
  return (
    <Routes>
      {/* Page d'accueil - choix Manager ou Visiteur */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Login Manager */}
      <Route path="/manager-login" element={<ManagerLoginPage />} />
      
      {/* Espace Manager (après login) */}
      <Route path="/manager" element={<MainDashboard />} />
      <Route path="/manager/map" element={<MainDashboard />} />
      
      {/* Mode Visiteur - carte seule */}
      <Route path="/visitor" element={<VisitorPage />} />
      
      {/* Auth - création de compte (sync vers Firebase) */}
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Rediriger /login vers accueil */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Routes protégées - User */}
      <Route element={<ProtectedRoute />}>
        <Route path="/signalement/new" element={<SignalementCreatePage />} />
        <Route path="/signalement/:id" element={<SignalementDetailPage />} />
      </Route>

      {/* Routes Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/blocked-users" element={<BlockedUsersPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
