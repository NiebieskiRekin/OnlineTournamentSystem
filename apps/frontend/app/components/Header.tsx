import * as React from 'react';
import Stack from '@mui/material/Stack';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import { Box, Typography } from '@mui/material';

export default function Header() {
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'flex-start', width: '90%' }}
      >
        <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
          Online Tournament System
        </Typography>
      </Stack>
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs />
    </Stack>
    </Box>
  );
}
