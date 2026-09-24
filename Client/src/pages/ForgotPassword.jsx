import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Link as MuiLink } from '@mui/material'
import { api } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Valid email is required'); return }
    setLoading(true)
    const result = await api.forgotPassword(email.trim())
    setLoading(false)
    if (result.status === 204 || result.status === 200) setSuccess(true)
    else if (result.status === 400) {
      if (result.error?.errors?.email) setError(result.error.errors.email)
      else setSuccess(true)
    } else setError(result.error?.message || 'Failed to send reset link')
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#f8fafc' }}>
      <Box sx={{ flex: 1, display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', justifyContent: 'center', p: 6, background: 'linear-gradient(135deg,#06b6d4 0%,#6366f1 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ maxWidth: 360 }}>
          <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.03em', mb: 2 }}>Forgot<br />password?</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.6 }}>No worries, we'll send you reset instructions. Link expires in 15 minutes.</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
        <Card sx={{ width: '100%', maxWidth: 420, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ height: 3, background: 'linear-gradient(90deg,#06b6d4 0%,#6366f1 100%)' }} />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Reset password</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Enter your email to receive a reset link</Typography>
            {success ? (
              <>
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  If an account exists, a reset link has been sent. Check backend console if mail is disabled.
                </Alert>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                  <Button component={Link} to="/login" variant="contained" fullWidth sx={{ borderRadius: 2 }}>Back to sign in</Button>
                  <Button onClick={() => { setSuccess(false); setEmail('') }} variant="text" fullWidth>Send another</Button>
                </Box>
              </>
            ) : (
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                <TextField label="Email *" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={loading} placeholder="you@company.com" />
                <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.4, borderRadius: 2 }}> {loading ? 'Sending...' : 'Send reset link'} </Button>
                <MuiLink component={Link} to="/login" variant="body2" align="center" sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}>Back to sign in</MuiLink>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
