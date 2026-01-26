import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminHome from './pages/AdminHome'
import LoginPage from './pages/LoginPage'
import PublicHome from './pages/PublicHome'
import RegisterPage from './pages/RegisterPage'
import UserHome from './pages/UserHome'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/user" element={<UserHome />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
        <Route path="/admin" element={<AdminHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
