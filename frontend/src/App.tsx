import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import AdminHome from './pages/AdminHome'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import PublicHome from './pages/PublicHome'
import RegisterPage from './pages/RegisterPage'
import SignalementCreatePage from './pages/SignalementCreatePage'
import UserHome from './pages/UserHome'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/user" element={<UserHome />} />
        <Route path="/user/signalements/new" element={<SignalementCreatePage />} />
        <Route path="/map" element={<MapPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
        <Route path="/admin" element={<AdminHome />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
