import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Link as MuiLink, Alert, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { register, error, clearError } = useAuth()
  const navigate = useNavigate()

  function update(field) { return (e) => setForm((c) => ({ ...c, [field]: e.target.value })) }
  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email must be valid'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    const errs = validate(); setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    const result = await register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), password: form.password })
    setLoading(false)
    if (result.success) navigate('/organizations')
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 6, background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        <Box sx={{ maxWidth: 360 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 4 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'white', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>F</Box>
            <Typography fontWeight={800}>FlowOS</Typography>
          </Box>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.05, letterSpacing: '-0.03em', mb: 2 }}>Create<br /><Box component="span" sx={{ color: '#a5b4fc' }}>your account</Box></Typography>
          <Typography variant="body2" sx={{ opacity: 0.7, lineHeight: 1.6 }}>Join thousands of teams shipping faster with FlowOS. Organizations, teams and modules in one OS.</Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 99, mt: 1 }} />
            <Typography variant="caption" sx={{ opacity: 0.6 }}>Trusted by teams</Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 99, mt: 1 }} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 440, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg,#0f172a 0%,#6366f1 100%)' }} />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Create account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Start your workspace in 30 seconds</Typography>
            {error && <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField label="First name" fullWidth value={form.firstName} onChange={update('firstName')} error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} placeholder="Amina" />
                <TextField label="Last name" fullWidth value={form.lastName} onChange={update('lastName')} error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} placeholder="Benali" />
              </Box>
              <TextField label="Email" type="email" fullWidth value={form.email} onChange={update('email')} error={!!fieldErrors.email} helperText={fieldErrors.email} placeholder="you@company.com" />
              <TextField label="Password" type={showPassword ? 'text' : 'password'} fullWidth value={form.password} onChange={update('password')} error={!!fieldErrors.password} helperText={fieldErrors.password || 'Min 8 characters'} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} />
              <TextField label="Confirm password" type={showConfirm ? 'text' : 'password'} fullWidth value={form.confirmPassword} onChange={update('confirmPassword')} error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.4, mt: 1, borderRadius: 2, background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' }}>{loading ? 'Creating...' : 'Create account'}</Button>
              <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                <MuiLink component={Link} to="/login" variant="body2" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}>Already have an account? Sign in</MuiLink>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
