import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, CircularProgress, Avatar, Chip, Grid, Divider,
} from '@mui/material'
import { Visibility, VisibilityOff, Person, Lock, Badge, Email } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, fetchProfile, updateProfile, changePassword } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingProfile(true)
      const res = await fetchProfile()
      if (cancelled) return
      if (res?.data) {
        setFirstName(res.data.firstName || '')
        setLastName(res.data.lastName || '')
        setPhoneNumber(res.data.phoneNumber || '')
      } else if (user) {
        setFirstName(user.firstName || '')
        setLastName(user.lastName || '')
        setPhoneNumber(user.phoneNumber || '')
      }
      setLoadingProfile(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  function validateProfile() {
    const e = {}
    if (!firstName.trim()) e.firstName = 'First name is required'
    else if (firstName.trim().length > 255) e.firstName = 'Max 255'
    if (!lastName.trim()) e.lastName = 'Last name is required'
    else if (lastName.trim().length > 255) e.lastName = 'Max 255'
    if (phoneNumber && phoneNumber.trim() && !/^[\d+()\-\\s]+$/.test(phoneNumber.trim())) e.phoneNumber = 'Phone number is invalid'
    return e
  }

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError(null); setProfileSuccess(false)
    const errs = validateProfile(); setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const result = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phoneNumber.trim() || null })
    setSaving(false)
    if (result.status === 200) { setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 3000) }
    else { if (result.error?.errors) setFieldErrors(result.error.errors); setProfileError(result.error?.message || 'Failed to update profile') }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null); setPasswordSuccess(false)
    if (!currentPassword) { setPasswordError('Current password is required'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    setPasswordSaving(true)
    const result = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)
    if (result.status === 204 || result.status === 200) {
      setPasswordSuccess(true); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setTimeout(() => setPasswordSuccess(false), 3000)
    } else setPasswordError(result.error?.message || 'Failed to change password')
  }

  if (loadingProfile) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 1 }}>
      <Box sx={{ mb: 3, p: 3, borderRadius: 3, background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#06b6d4 100%)', color: 'white', position: 'relative', overflow: 'hidden', display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'white', color: '#6366f1', fontWeight: 800, fontSize: 20, border: '2px solid rgba(255,255,255,0.3)' }}>
          {(firstName[0] || user?.firstName?.[0] || 'U').toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>{firstName} {lastName}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.8 }}><Email sx={{ fontSize: 14 }} /> {user?.email}</Typography>
        </Box>
        <Chip label="Active" size="small" sx={{ bgcolor: 'white', color: '#6366f1', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }} />
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 3, background: 'linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}><Person sx={{ fontSize: 16, color: 'primary.main' }} /></Box>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.015em' }}>Profile Information</Typography>
              </Box>
              <Box component="form" onSubmit={handleProfileSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {profileError && <Alert severity="error" sx={{ borderRadius: 2 }}>{profileError}</Alert>}
                {profileSuccess && <Alert severity="success" sx={{ borderRadius: 2 }}>Profile updated</Alert>}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField label="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} />
                  <TextField label="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} />
                </Box>
                <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth error={!!fieldErrors.phoneNumber} helperText={fieldErrors.phoneNumber || 'Digits, +, (), space, -'} placeholder="+212 600 000 000" />
                <TextField label="Email" value={user?.email || ''} disabled fullWidth helperText="Email cannot be changed here" InputProps={{ startAdornment: <Email sx={{ fontSize: 16, color: 'text.disabled', mr: 1 }} /> }} />
                <Button type="submit" variant="contained" disabled={saving} sx={{ mt: 1, borderRadius: 2, py: 1.2, background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)' }}>{saving ? 'Saving...' : 'Save Profile'}</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 3, background: 'linear-gradient(90deg,#f59e0b 0%,#ef4444 100%)' }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'grey.900', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock sx={{ fontSize: 16 }} /></Box>
                <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.015em' }}>Change Password</Typography>
              </Box>
              <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {passwordError && <Alert severity="error" sx={{ borderRadius: 2 }}>{passwordError}</Alert>}
                {passwordSuccess && <Alert severity="success" sx={{ borderRadius: 2 }}>Password changed</Alert>}
                <TextField label="Current Password *" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth required slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} />
                <TextField label="New Password *" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required helperText="Min 8 characters" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowNew(!showNew)}>{showNew ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment> } }} />
                <TextField label="Confirm New Password *" type={showNew ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required />
                <Button type="submit" variant="contained" disabled={passwordSaving} sx={{ mt: 1, borderRadius: 2, py: 1.2, bgcolor: 'grey.900', '&:hover': { bgcolor: '#1e293b' } }}>{passwordSaving ? 'Changing...' : 'Change Password'}</Button>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>Keep your account secure with a strong password</Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2, bgcolor: 'grey.50', border: '1px dashed #e2e8f0' }}>
            <CardContent sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Badge color="success" variant="dot" />
              <Box>
                <Typography variant="body2" fontWeight={600}>Security tip</Typography>
                <Typography variant="caption" color="text.secondary">Use a unique password and never share it.</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
