import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
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

  function update(field) {
    return (e) => setForm((p) => ({ ...p, [field]: e.target.value }))
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (form.phoneNumber && !/^[\d+()\-\\s]+$/.test(form.phoneNumber)) e.phoneNumber = 'Phone number is invalid'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    if (!token) {
      setError('Invitation token missing')
      return
    }
    setLoading(true)
    const result = await api.acceptInvitation(token, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      password: form.password,
    })
    setLoading(false)

    if (result.status === 200 && result.data?.token) {
      setSession(result.data.token, {
        userId: result.data.userId,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        email: result.data.email,
      })
      // ensure profile is fresh
      api.getProfile().then(() => {})
      setSuccess(true)
      setTimeout(() => window.location.assign('/organizations'), 800)
      return
    }

    // error handling per handoff
    if (result.status === 400) {
      if (result.error?.errors) setFieldErrors(result.error.errors)
      setError(result.error?.message || 'Validation failed')
      return
    }
    if (result.error?.message?.toLowerCase().includes('invalid') || result.error?.message?.toLowerCase().includes('expired')) {
      setError('Invitation is invalid or expired (48h). Request a new invitation.')
      return
    }
    if (result.error?.message?.toLowerCase().includes('already a member')) {
      setError('You are already a member of this organization. Please sign in.')
      return
    }
    setError(result.error?.message || `Failed to accept invitation (${result.status})`)
  }

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
        <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}><CardContent><Alert severity="error">Invalid invitation link.</Alert></CardContent></Card>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 480, p: 1 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700 }}>Accept invitation</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Create your account for this organization. Your email is taken from the invitation.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 2 }}>Account created - redirecting...</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First name *" fullWidth value={form.firstName} onChange={update('firstName')} error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} disabled={loading || success} />
              <TextField label="Last name *" fullWidth value={form.lastName} onChange={update('lastName')} error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} disabled={loading || success} />
            </Box>
            <TextField label="Phone (optional)" fullWidth value={form.phoneNumber} onChange={update('phoneNumber')} error={!!fieldErrors.phoneNumber} helperText={fieldErrors.phoneNumber} disabled={loading || success} />
            <TextField
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={form.password}
              onChange={update('password')}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password || 'Min 8 characters'}
              disabled={loading || success}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />
            <TextField
              label="Confirm password *"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              disabled={loading || success}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading || success} sx={{ py: 1.5 }}>
              {loading ? 'Creating account...' : 'Create account & join'}
            </Button>

            <Typography variant="body2" align="center">
              Already have an account? <Link to="/login">Sign in</Link> then use the same invitation link.
            </Typography>
            <Typography variant="caption" align="center" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              Token: {token.slice(0, 8)}...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
