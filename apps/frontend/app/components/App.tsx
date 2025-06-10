import Box from '@mui/material/Box';
import { Outlet } from 'react-router';
import SideMenu from '~/components/SideMenu';

export default function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <SideMenu />
      <Outlet/>
    </Box>
  );
}
