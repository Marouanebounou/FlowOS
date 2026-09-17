import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import { Box, Card, CardContent, Typography } from '@mui/material'

const AppLayout = lazy(() => import('./components/AppLayout'))
const Organizations = lazy(() => import('./pages/Organizations'))
const Profile = lazy(() => import('./pages/Profile'))

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
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Card><CardContent><Typography variant="h6">Coming soon</Typography></CardContent></Card></Box>} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="organizations" replace />} />
          <Route path="organizations" element={<Organizations />} />
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
