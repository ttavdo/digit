import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DeveloperDashboard from './pages/DeveloperDashboard'
import Admin from './pages/Admin'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route
            path="contact"
            element={
              <RoleProtectedRoute allowedRoles={['customer']}>
                <Contact />
              </RoleProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<Admin />} />

        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/dashboard/orders"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard initialTab="orders" />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/developer-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['developer']}>
              <DeveloperDashboard />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
