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
    // privacy-preserving: always show success for 204 or 400 (don't reveal existence)
    if (result.status === 204 || result.status === 200) {
      setSuccess(true)
    } else if (result.status === 400) {
      // still show success to avoid account enumeration, but show field error if clearly invalid format
      if (result.error?.errors?.email) setError(result.error.errors.email)
      else setSuccess(true)
    } else {
      setError(result.error?.message || 'Failed to send reset link')
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700 }}>Forgot password</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email and we will send a reset link if the account exists.
          </Typography>

          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account with that email exists, a reset link has been sent. The link expires in 15 minutes and is single-use.
                Check backend console if mail is disabled.
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Button component={Link} to="/login" variant="contained" fullWidth>Back to sign in</Button>
                <Button onClick={() => { setSuccess(false); setEmail('') }} variant="text" fullWidth>Send another</Button>
              </Box>
            </>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Email *" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={loading} />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5 }}>{loading ? 'Sending...' : 'Send reset link'}</Button>
              <MuiLink component={Link} to="/login" variant="body2" align="center">Back to sign in</MuiLink>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
