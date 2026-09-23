import { useParams, Link } from 'react-router-dom'
import { Box, Card, CardContent, Typography, Button, Chip, Alert } from '@mui/material'
import { Extension } from '@mui/icons-material'

export default function ModulePlaceholder() {
  const { organisationId, moduleKey } = useParams()
  const names = {
    tasks: 'Tasks',
    projects: 'Projects',
    calendar: 'Calendar',
    crm: 'CRM',
    documents: 'Documents',
  }
  const name = names[moduleKey] || moduleKey

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Extension color="primary" />
        <Typography variant="h4" fontWeight={700}>{name}</Typography>
        <Chip label={`module: ${moduleKey}`} size="small" variant="outlined" />
      </Box>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" fontWeight={600}>This is the real workspace for {name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Organization #{organisationId} has <strong>{name}</strong> installed and enabled. Employees see this module in the left nav (dynamic from <code>installedModules</code>).
          Future work: replace this placeholder with real CRUD for {name} (tasks, boards, etc.) and gate by permissions like <code>{moduleKey}.read</code>.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Install/uninstall & enable/disable in <Link to={`/organizations/${organisationId}`}>Organization → Modules tab</Link> (ADMIN only). Employee sees this page automatically when enabled.
        </Alert>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button component={Link} to={`/organizations/${organisationId}`} variant="outlined">Back to organization</Button>
          <Button component={Link} to="/dashboard" variant="contained">Go to dashboard</Button>
        </Box>
      </CardContent></Card>

      <Card><CardContent>
        <Typography variant="subtitle2" fontWeight={700}>Next steps for this module</Typography>
        <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 1 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Create tables `tasks`, `projects` etc. + Flyway migration</li>
            <li>Add `Team` scoping: tasks belong to a team within the org</li>
            <li>Add permission codes like <code>{moduleKey}.read</code>, <code>{moduleKey}.create</code></li>
            <li>Replace this placeholder with real list/create/detail views</li>
          </ul>
        </Typography>
      </CardContent></Card>
    </Box>
  )
}
