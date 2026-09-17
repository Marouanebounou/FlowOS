import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [saving, setSaving] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(false)
    setSaving(true)

    const result = await updateProfile({ firstName, lastName, phoneNumber })
    setSaving(false)

    if (result.status === 200) {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } else {
      setProfileError(result.error?.message || 'Failed to update profile')
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    const result = await changePassword({ currentPassword, newPassword })
    setPasswordSaving(false)

    if (result.status === 204 || result.status === 200) {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      setPasswordError(result.error?.message || 'Failed to change password')
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        My Profile
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Profile Information
          </Typography>
          <Box component="form" onSubmit={handleProfileSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
            {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>Profile updated</Alert>}

            <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
            <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
            <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
            <TextField label="Email" value={user?.email || ''} disabled fullWidth />

            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Change Password
          </Typography>
          <Box component="form" onSubmit={handlePasswordSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>Password changed</Alert>}

            <TextField label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth required />
            <TextField label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth required />
            <TextField label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth required />

            <Button type="submit" variant="contained" disabled={passwordSaving}>
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
