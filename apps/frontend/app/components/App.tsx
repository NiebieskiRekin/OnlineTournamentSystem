import Box from '@mui/material/Box';
import { Outlet } from 'react-router';
import SideMenu from '~/components/SideMenu';

export default function Layout() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}> {/* Ensure full viewport height */}
      <SideMenu />
      <Box
        component="main" // Use main semantic tag
        sx={{
          flexGrow: 1, // Allow this Box to grow and fill available space
          overflow: 'auto', // Add scrollbars if content overflows
          display: 'flex', // Make it a flex container for the Outlet content
          flexDirection: 'column', // Stack Outlet content vertically
          // p: 2, // Example padding, adjust as needed or apply in route components
        }}
      >
        <Outlet /> {/* Route components will render here and can use 100% width/height */}
      </Box>
    </Box>
  );
}
