import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { register, error, clearError } = useAuth()
  const navigate = useNavigate()

  function updateField(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  function validate() {
    const errors = {}
    if (!form.firstName.trim()) errors.firstName = 'First name is required'
    if (!form.lastName.trim()) errors.lastName = 'Last name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email must be valid'
    if (!form.password) errors.password = 'Password is required'
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    return errors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    clearError()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    const result = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    })
    setLoading(false)

    if (result.success) navigate('/organizations')
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            FlowOS
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Create your account
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First name" fullWidth value={form.firstName} onChange={updateField('firstName')} autoComplete="given-name" error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} />
              <TextField label="Last name" fullWidth value={form.lastName} onChange={updateField('lastName')} autoComplete="family-name" error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} />
            </Box>

            <TextField label="Email" type="email" fullWidth value={form.email} onChange={updateField('email')} autoComplete="email" error={!!fieldErrors.email} helperText={fieldErrors.email} />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton type="button" aria-label="Show password" onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />

            <TextField
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton type="button" aria-label="Show confirmation password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <MuiLink component={Link} to="/login" variant="body2" align="center">
              Already have an account? Sign in
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}