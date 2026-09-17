import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material'
import { AccountCircle } from '@mui/icons-material'

const drawerWidth = 240

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  function handleMenuOpen(e) {
    setAnchorEl(e.currentTarget)
  }

  function handleMenuClose() {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' },
        }}
      >
        <Box sx={{ pt: 2, px: 2 }}>
          <Typography variant="h5" fontWeight={700} color="primary">
            FlowOS
          </Typography>
        </Box>
        <Box component="nav" sx={{ mt: 1 }}>
          <Button
            component={Link}
            to="/organizations"
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              px: 2,
              borderRadius: 1,
              bgcolor: location.pathname.startsWith('/organizations') ? 'action.selected' : 'transparent',
              mb: 0.5,
              textTransform: 'none',
            }}
          >
            Organizations
          </Button>
          <Button
            component={Link}
            to="/profile"
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              px: 2,
              borderRadius: 1,
              bgcolor: location.pathname === '/profile' ? 'action.selected' : 'transparent',
              textTransform: 'none',
            }}
          >
            Profile
          </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Organization
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handleMenuOpen} size="small">
                <AccountCircle />
              </IconButton>
              <Typography variant="body2" fontWeight={500}>{user?.firstName || 'User'}</Typography>
              <Button variant="outlined" size="small" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="section" sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile') }}>Profile</MenuItem>
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Box>
  )
}
