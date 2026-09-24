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
    setLoading(true)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }

    const result = await login({ email: email.trim(), password })
    setLoading(false)

    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 4 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            FlowOS
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={!!fieldErrors.password}
              helperText={fieldErrors.password}
              slotProps={{
                input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                },
              }}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <MuiLink component={Link} to="/register" variant="body2">
                Create an account
              </MuiLink>
              <MuiLink component={Link} to="/forgot-password" variant="body2">
                Forgot password
              </MuiLink>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
