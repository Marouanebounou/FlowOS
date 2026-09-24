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
    e.preventDefault(); setError(null)
    if (!token) { setError('Reset token missing from link'); return }
    if (!newPassword || newPassword.length < 8) { setError('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const result = await api.resetPassword(token, newPassword)
    setLoading(false)
    if (result.status === 204 || result.status === 200) { setSuccess(true); setTimeout(() => navigate('/login'), 2000); return }
    if (result.status === 400) {
      if (result.error?.message?.toLowerCase().includes('expired') || result.error?.message?.toLowerCase().includes('invalid') || result.error?.message?.toLowerCase().includes('used')) setError('Reset link is invalid, expired (15 min) or already used.')
      else setError(result.error?.message || 'Validation failed')
      return
    }
    setError(result.error?.message || `Failed to reset (${result.status})`)
  }

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', p: 2 }}>
        <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}><CardContent sx={{ p: 3, textAlign: 'center' }}><Alert severity="error" sx={{ borderRadius: 2 }}>Invalid reset link - token missing.</Alert><Button component={Link} to="/forgot-password" sx={{ mt: 2 }} fullWidth variant="contained">Request new link</Button></CardContent></Card>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 6, background: 'linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.03em', mb: 2 }}>Set new<br />password</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 300 }}>Choose a strong unique password. Token kept only in memory.</Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 420, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg,#ec4899 0%,#8b5cf6 100%)' }} />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Reset password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Enter your new password</Typography>
            {success ? <Alert severity="success" sx={{ borderRadius: 2 }}>Password reset - redirecting to sign in...</Alert> : (
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                <TextField label="New password *" type={show ? 'text' : 'password'} fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required helperText="Min 8 characters" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShow(!show)}>{show ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} disabled={loading} />
                <TextField label="Confirm new password *" type={show ? 'text' : 'password'} fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
                <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.4, borderRadius: 2, background: 'linear-gradient(135deg,#ec4899 0%,#8b5cf6 100%)' }}>{loading ? 'Resetting...' : 'Reset password'}</Button>
                <MuiLink component={Link} to="/login" variant="body2" align="center" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}>Back to sign in</MuiLink>
                <Typography variant="caption" align="center" color="text.secondary" sx={{ wordBreak: 'break-all' }}>Token: {token.slice(0, 8)}...</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
