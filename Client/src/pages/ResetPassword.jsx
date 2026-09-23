import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, Link as MuiLink } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { api } from '../api/client'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!token) { setError('Reset token missing from link'); return }
    if (!newPassword || newPassword.length < 8) { setError('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const result = await api.resetPassword(token, newPassword)
    setLoading(false)
    if (result.status === 204 || result.status === 200) {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
      return
    }
    if (result.status === 400) {
      if (result.error?.message?.toLowerCase().includes('expired') || result.error?.message?.toLowerCase().includes('invalid') || result.error?.message?.toLowerCase().includes('used')) {
        setError('Reset link is invalid, expired (15 min) or already used. Request a new one.')
      } else {
        setError(result.error?.message || 'Validation failed')
      }
      return
    }
    setError(result.error?.message || `Failed to reset (${result.status})`)
  }

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
        <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}><CardContent><Alert severity="error">Invalid reset link - token missing. Check your email link.</Alert><Button component={Link} to="/forgot-password" sx={{ mt: 2 }} fullWidth variant="contained">Request new link</Button></CardContent></Card>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700 }}>Reset password</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your new password. Token is kept only in memory and never logged.
          </Typography>

          {success ? (
            <Alert severity="success">Password reset - redirecting to sign in...</Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="New password *" type={show ? 'text' : 'password'} fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required helperText="Min 8 characters" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShow(!show)} edge="end">{show ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} disabled={loading} />
              <TextField label="Confirm new password *" type={show ? 'text' : 'password'} fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5 }}>{loading ? 'Resetting...' : 'Reset password'}</Button>
              <MuiLink component={Link} to="/login" variant="body2" align="center">Back to sign in</MuiLink>
              <Typography variant="caption" align="center" color="text.secondary" sx={{ wordBreak: 'break-all' }}>Token: {token.slice(0, 8)}...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
