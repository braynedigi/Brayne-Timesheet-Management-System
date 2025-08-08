import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { BrandingProvider } from '@/contexts/BrandingContext'

// Layouts
import DashboardLayout from '@/components/layouts/DashboardLayout'
import AuthLayout from '@/components/layouts/AuthLayout'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TimesheetsPage from '@/pages/TimesheetsPage'
import ClientsPage from '@/pages/ClientsPage'
import ProjectsPage from '@/pages/ProjectsPage'
import UsersPage from '@/pages/UsersPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider>
      <BrandingProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          } />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="timesheets" element={<TimesheetsPage />} />
            <Route path="clients" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />

          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </div>
      </BrandingProvider>
    </ThemeProvider>
  )
}

export default App
