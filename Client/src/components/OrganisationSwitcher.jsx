import { useNavigate } from 'react-router-dom'
import { FormControl, Select, MenuItem, Box, Typography, Avatar } from '@mui/material'
import { Business } from '@mui/icons-material'
import { useOrganisation } from '../contexts/OrganisationContext'

export default function OrganisationSwitcher() {
  const { organizations, activeId, select, loading } = useOrganisation()
  const navigate = useNavigate()

  if (loading) return null

  if (organizations.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
        No organizations
      </Typography>
    )
  }

  function handleChange(e) {
    const id = Number(e.target.value)
    select(id)
    navigate(`/organizations/${id}`)
  }

  return (
    <FormControl size="small" sx={{ minWidth: 180, maxWidth: 220 }}>
      <Select
        value={activeId ?? ''}
        onChange={handleChange}
        displayEmpty
        variant="outlined"
        sx={{ bgcolor: 'background.paper', '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1, py: 0.7 } }}
        renderValue={(value) => {
          const org = organizations.find((o) => o.id === value)
          if (!org) return <Typography variant="body2" color="text.secondary">Select organization</Typography>
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar src={org.logoUrl || undefined} sx={{ width: 24, height: 24, bgcolor: org.primaryColor || 'primary.main', fontSize: 12 }}>
                {!org.logoUrl && <Business sx={{ fontSize: 14 }} />}
              </Avatar>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{org.name}</Typography>
            </Box>
          )
        }}
      >
        {organizations.map((org) => (
          <MenuItem key={org.id} value={org.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={org.logoUrl || undefined} sx={{ width: 24, height: 24, bgcolor: org.primaryColor || 'primary.main', fontSize: 12 }}>
                {!org.logoUrl && <Business sx={{ fontSize: 14 }} />}
              </Avatar>
              <Typography variant="body2" noWrap>{org.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
