import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, Link as MuiLink, Alert, InputAdornment, IconButton, Divider,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { login, error, clearError } = useAuth()
  const navigate = useNavigate()

  function validate() {
    const errors = {}
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email must be valid'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters'
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFieldErrors({})
    clearError()
    const errors = validate()
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setLoading(true)
    const result = await login({ email: email.trim(), password })
    setLoading(false)
    if (result.success) navigate('/dashboard')
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: 80, left: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 6 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'white', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>F</Box>
            <Typography variant="h6" fontWeight={800}>FlowOS</Typography>
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.03em', mb: 2 }}>
            Work<br />flows<br /><Box component="span" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 400 }}>faster.</Box>
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 320, lineHeight: 1.6 }}>
            The workspace OS for teams. Organizations, teams, roles and modules — one shell.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ width: 32, height: 4, borderRadius: 99, bgcolor: 'white' }} />
          <Box sx={{ width: 16, height: 4, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.4)' }} />
          <Box sx={{ width: 16, height: 4, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.3)' }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }, bgcolor: '#f8fafc' }}>
        <Card sx={{ width: '100%', maxWidth: 420, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)' }} />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Sign in to your FlowOS workspace</Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>{error}</Alert>}
              <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={!!fieldErrors.email} helperText={fieldErrors.email} placeholder="you@company.com" />
              <TextField
                label="Password" type={showPassword ? 'text' : 'password'} fullWidth value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" error={!!fieldErrors.password} helperText={fieldErrors.password}
                slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.4, mt: 1, borderRadius: 2, boxShadow: '0 4px 12px -2px rgb(99 102 241 / 0.35)' }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <MuiLink component={Link} to="/register" variant="body2" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}>Create account</MuiLink>
                <MuiLink component={Link} to="/forgot-password" variant="body2" sx={{ color: 'text.secondary', textDecoration: 'none' }}>Forgot password?</MuiLink>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" align="center">Secure • Encrypted • SSO ready</Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
