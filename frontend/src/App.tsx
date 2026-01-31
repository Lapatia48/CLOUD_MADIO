import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import BlockedUsersPage from './pages/BlockedUsersPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SignalementCreatePage from './pages/SignalementCreatePage'
import SignalementDetailPage from './pages/SignalementDetailPage'
import MainDashboard from './pages/MainDashboard'

function App() {
  return (
    <Routes>
      {/* Page principale avec carte - accessible à tous */}
      <Route path="/" element={<MainDashboard />} />
      <Route path="/map" element={<MainDashboard />} />
      
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes protégées - User */}
      <Route element={<ProtectedRoute />}>
        <Route path="/signalement/new" element={<SignalementCreatePage />} />
        <Route path="/signalement/:id" element={<SignalementDetailPage />} />
      </Route>

      {/* Routes Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/blocked-users" element={<BlockedUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
