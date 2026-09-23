import { useState, useEffect } from 'react'
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
  CircularProgress,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
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

  // hydrate from auth + fetch fresh
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // keep form in sync if user changes externally
  useEffect(() => {
    if (user && !loadingProfile) {
      // don't overwrite while editing - only if empty? simpler: sync on user change
      // use timeout to avoid fighting typing
    }
  }, [user, loadingProfile])

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
    setProfileError(null)
    setProfileSuccess(false)
    const errs = validateProfile()
    setFieldErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const result = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phoneNumber.trim() || null })
    setSaving(false)
    if (result.status === 200) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      if (result.error?.errors) setFieldErrors(result.error.errors)
      setProfileError(result.error?.message || 'Failed to update profile')
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (!currentPassword) { setPasswordError('Current password is required'); return }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    setPasswordSaving(true)
    const result = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)
    if (result.status === 204 || result.status === 200) {
      setPasswordSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      setPasswordError(result.error?.message || 'Failed to change password')
    }
  }

  if (loadingProfile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>My Profile</Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Profile Information</Typography>
          <Box component="form" onSubmit={handleProfileSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {profileError && <Alert severity="error">{profileError}</Alert>}
            {profileSuccess && <Alert severity="success">Profile updated</Alert>}
            <TextField label="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth error={!!fieldErrors.firstName} helperText={fieldErrors.firstName} />
            <TextField label="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth error={!!fieldErrors.lastName} helperText={fieldErrors.lastName} />
            <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth error={!!fieldErrors.phoneNumber} helperText={fieldErrors.phoneNumber || 'Digits, +, (), space, -'} />
            <TextField label="Email" value={user?.email || ''} disabled fullWidth helperText="Email cannot be changed here" />
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>Change Password</Typography>
          <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success">Password changed</Alert>}
            <TextField label="Current Password *" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth required slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end">{showCurrent ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
            <TextField label="New Password *" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required helperText="Min 8 characters" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNew(!showNew)} edge="end">{showNew ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> } }} />
            <TextField label="Confirm New Password *" type={showNew ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required />
            <Button type="submit" variant="contained" disabled={passwordSaving}>{passwordSaving ? 'Changing...' : 'Change Password'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
