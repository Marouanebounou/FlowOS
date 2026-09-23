import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { OrganisationProvider } from './contexts/OrganisationContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { Box, Card, CardContent, Typography } from '@mui/material'

const AppLayout = lazy(() => import('./components/AppLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Organizations = lazy(() => import('./pages/Organizations'))
const OrganizationDetail = lazy(() => import('./pages/OrganizationDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const InvitationAccept = lazy(() => import('./pages/InvitationAccept'))
const ModulePlaceholder = lazy(() => import('./pages/ModulePlaceholder'))

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Typography variant="h6">Loading...</Typography></Box>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</Box>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invitations/:token" element={<InvitationAccept />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <OrganisationProvider>
              <AppLayout />
            </OrganisationProvider>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="organizations" element={<Organizations />} />
          <Route path="organizations/:organisationId" element={<OrganizationDetail />} />
          <Route path="organizations/:organisationId/modules/:moduleKey" element={<ModulePlaceholder />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}><Card><CardContent><Typography variant="h4">Not Found</Typography><Typography variant="body1" sx={{ mt: 2 }}>The page you are looking for does not exist.</Typography></CardContent></Card></Box>} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
