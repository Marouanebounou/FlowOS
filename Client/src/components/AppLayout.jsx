import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Box, Drawer, AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton, Avatar, Divider, Tooltip, Badge,
} from '@mui/material'
import {
  AccountCircle, Extension, Task, Folder, CalendarToday, People, Description,
  Dashboard, Business, Person, Logout, SettingsOutlined,
} from '@mui/icons-material'
import OrganisationSwitcher from './OrganisationSwitcher'
import { useOrganisation } from '../contexts/OrganisationContext'
import { api } from '../api/client'

const MODULE_ICONS = {
  tasks: Task,
  projects: Folder,
  calendar: CalendarToday,
  crm: People,
  documents: Description,
}

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: Dashboard },
  { label: 'Organizations', to: '/organizations', icon: Business },
  { label: 'Profile', to: '/profile', icon: Person },
]

const drawerWidth = 272

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { activeId } = useOrganisation()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const [installed, setInstalled] = useState([])

  useEffect(() => {
    let cancelled = false
    async function fetchInstalled() {
      if (!activeId) { setInstalled([]); return }
      const res = await api.listInstalledModules(activeId)
      if (!cancelled && res.status === 200) setInstalled(res.data.filter((m) => m.enabled))
      else if (!cancelled) setInstalled([])
    }
    fetchInstalled()
    return () => { cancelled = true }
  }, [activeId])

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
    navigate('/login')
  }

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard'
    if (to === '/organizations') return location.pathname.startsWith('/organizations')
    return location.pathname === to
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2.5, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>F</Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>FlowOS</Typography>
            <Box sx={{ ml: 'auto', bgcolor: 'grey.100', px: 1, py: 0.2, borderRadius: 1, fontSize: 10, fontWeight: 700, color: 'text.secondary', border: '1px solid #e2e8f0' }}>OS</Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontWeight: 500 }}>Workspace OS</Typography>
        </Box>

        <Box component="nav" sx={{ px: 1.5, flex: 1, overflowY: 'auto' }}>
          <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em', fontSize: 10 }}>MAIN</Typography>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.to)
            return (
              <Button
                key={item.to}
                component={Link}
                to={item.to}
                fullWidth
                startIcon={<Icon sx={{ fontSize: 18 }} />}
                sx={{
                  justifyContent: 'flex-start',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: active ? 'primary.dark' : 'grey.100', color: active ? 'white' : 'text.primary' },
                  mb: 0.5,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  '& .MuiButton-startIcon': { mr: 1.2 },
                }}
              >
                {item.label}
              </Button>
            )
          })}

          {installed.length > 0 && (
            <>
              <Divider sx={{ my: 1.5, mx: 1 }} />
              <Typography variant="caption" sx={{ px: 1.5, py: 1, display: 'block', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em', fontSize: 10 }}>
                MODULES • {installed.length}
              </Typography>
              {installed.map((mod) => {
                const Icon = MODULE_ICONS[mod.moduleKey] || Extension
                const to = `/organizations/${activeId}/modules/${mod.moduleKey}`
                const active = location.pathname === to
                return (
                  <Button
                    key={mod.moduleKey}
                    component={Link}
                    to={to}
                    fullWidth
                    startIcon={<Icon sx={{ fontSize: 16 }} />}
                    sx={{
                      justifyContent: 'flex-start',
                      px: 1.5,
                      py: 0.9,
                      borderRadius: 2,
                      bgcolor: active ? 'grey.900' : 'transparent',
                      color: active ? 'white' : 'text.secondary',
                      '&:hover': { bgcolor: active ? 'grey.900' : 'grey.100', color: active ? 'white' : 'text.primary' },
                      mb: 0.5,
                      fontSize: 13,
                    }}
                  >
                    {mod.moduleName}
                    {active && <Box sx={{ ml: 'auto', width: 6, height: 6, borderRadius: 99, bgcolor: 'success.main' }} />}
                  </Button>
                )
              })}
            </>
          )}
        </Box>

        <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, p: 1, borderRadius: 2, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: 13, lineHeight: 1 }}>{user?.firstName || 'User'} {user?.lastName || ''}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>{user?.email || ''}</Typography>
            </Box>
            <Tooltip title="Settings"><IconButton size="small" onClick={() => navigate('/profile')}><SettingsOutlined sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, minHeight: 56 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
              <OrganisationSwitcher />
              {activeId && installed.length > 0 && (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, ml: 1, pl: 1.5, borderLeft: '1px solid #e2e8f0' }}>
                  {installed.slice(0, 4).map((m) => (
                    <Box key={m.moduleKey} sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: 'success.main', opacity: 0.9 }} />
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 600 }}>{installed.length} enabled</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Account">
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                  <AccountCircle sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13, lineHeight: 1 }}>{user?.firstName || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{user?.email || ''}</Typography>
              </Box>
              <Button variant="outlined" size="small" onClick={handleLogout} disabled={loggingOut} startIcon={<Logout sx={{ fontSize: 14 }} />} sx={{ ml: 0.5, borderColor: '#e2e8f0', color: 'text.secondary', bgcolor: 'white', '&:hover': { borderColor: '#cbd5e1', bgcolor: 'grey.50' } }}>
                {loggingOut ? '...' : 'Sign out'}
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="section" sx={{ p: { xs: 2, md: 3 }, flex: 1, bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ sx: { mt: 1, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', minWidth: 180 } }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
          <Typography variant="body2" fontWeight={700}>{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </Box>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile') }}>Profile</MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/organizations') }}>Organizations</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
      </Menu>
    </Box>
  )
}
