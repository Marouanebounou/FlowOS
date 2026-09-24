import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { api } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

export default function InvitationAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  function update(field) { return (e) => setForm((p) => ({ ...p, [field]: e.target.value })) }
  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (form.phoneNumber && !/^[\d+()\-\\s]+$/.test(form.phoneNumber)) e.phoneNumber = 'Phone number is invalid'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(null)
    const errs = validate(); setFieldErrors(errs)
    if (Object.keys(errs).length) return
    if (!token) { setError('Invitation token missing'); return }
    setLoading(true)
    const result = await api.acceptInvitation(token, {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || null, password: form.password,
    })
    setLoading(false)
    if (result.status === 200 && result.data?.token) {
      setSession(result.data.token, { userId: result.data.userId, firstName: result.data.firstName, lastName: result.data.lastName, email: result.data.email })
      api.getProfile().then(() => {})
      setSuccess(true); setTimeout(() => window.location.assign('/organizations'), 800); return
    }
    if (result.status === 400) {
      if (result.error?.errors) setFieldErrors(result.error.errors)
      setError(result.error?.message || 'Validation failed'); return
    }
    if (result.error?.message?.toLowerCase().includes('invalid') || result.error?.message?.toLowerCase().includes('expired')) { setError('Invitation is invalid or expired (48h).'); return }
    if (result.error?.message?.toLowerCase().includes('already a member')) { setError('You are already a member. Please sign in.'); return }
    setError(result.error?.message || `Failed to accept invitation (${result.status})`)
  }

  if (!token) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', p: 2 }}><Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}><CardContent sx={{ p: 3, textAlign: 'center' }}><Alert severity="error">Invalid invitation link.</Alert></CardContent></Card></Box>
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 6, background: 'linear-gradient(135deg,#10b981 0%,#06b6d4 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.03em', mb: 2 }}>You've been<br />invited!</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 320, lineHeight: 1.6 }}>Create your account to join the organization. Email is taken from the invitation.</Typography>
        <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.15)' }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Token</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{token.slice(0, 16)}...</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 480, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg,#10b981 0%,#06b6d4 100%)' }} />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Accept invitation</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Create your account for this organization</Typography>
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>Account created - redirecting...</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField label="First name *" fullWidth value={form.firstName} onChange={update('firstName')} error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} disabled={loading || success} placeholder="Amina" />
                <TextField label="Last name *" fullWidth value={form.lastName} onChange={update('lastName')} error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} disabled={loading || success} placeholder="Benali" />
              </Box>
              <TextField label="Phone (optional)" fullWidth value={form.phoneNumber} onChange={update('phoneNumber')} error={!!fieldErrors.phoneNumber} helperText={fieldErrors.phoneNumber} disabled={loading || success} placeholder="+212 600 000 000" />
              <TextField label="Password *" type={showPassword ? 'text' : 'password'} fullWidth value={form.password} onChange={update('password')} error={!!fieldErrors.password} helperText={fieldErrors.password || 'Min 8 characters'} disabled={loading || success} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} />
              <TextField label="Confirm password *" type={showPassword ? 'text' : 'password'} fullWidth value={form.confirmPassword} onChange={update('confirmPassword')} error={!!fieldErrors.confirmPassword} helperText={fieldErrors.confirmPassword} disabled={loading || success} />
              <Button type="submit" variant="contained" fullWidth disabled={loading || success} sx={{ py: 1.4, borderRadius: 2, background: 'linear-gradient(135deg,#10b981 0%,#06b6d4 100%)' }}>{loading ? 'Creating account...' : 'Create account & join'}</Button>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link></Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
