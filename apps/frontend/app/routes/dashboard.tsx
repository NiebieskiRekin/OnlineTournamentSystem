/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from '~/components/Header';
import MainGrid from '~/components/MainGrid';
import { useSearchParams } from 'react-router';

export default function Dashboard() {
  const [search, ] = useSearchParams();

  return (
    <Box
    component="main"
    sx={(theme) => ({
      flexGrow: 1,
      backgroundColor: theme.vars
        ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
        : alpha(theme.palette.background.default, 1),
      overflow: 'auto',
    })}
  >
    <Stack
      spacing={2}
      sx={{
        alignItems: 'center',
        mx: 3,
        pb: 5,
        mt: { xs: 8, md: 0 },
      }}
    >
      <Header />
      <MainGrid participant={search.get("participant")}/>
    </Stack>
  </Box>
  );
}
