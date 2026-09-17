import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
} from '@mui/material'

export default function Organizations() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Organizations
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Your Organizations</Typography>
            <Button variant="contained">Create Organization</Button>
          </Box>

          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You are not a member of any organization yet.
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Create an organization to get started.
            </Typography>
            <Button variant="contained">Create Organization</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
