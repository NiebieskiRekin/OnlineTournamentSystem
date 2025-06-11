import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import { useLocation, NavLink } from 'react-router';
import { authClient } from '~/lib/auth';
import { GamepadRounded } from '@mui/icons-material';

export default function MenuContent() {
  const session = authClient.useSession()
  const location = useLocation()

  const mainListItems = [
    { text: 'Home', icon: <HomeRoundedIcon />, query: "", baseUrl: "/" },
    { text: 'My Tournaments', icon: <AnalyticsRoundedIcon />, query: `?participant=${session.data?.user.id}`, baseUrl: "/" },
    { text: 'My Games', icon: <GamepadRounded />, query: `?participant=${session.data?.user.id}`, baseUrl: "/matches/"},
  ];

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <NavLink to={item.baseUrl+item.query}>
              <ListItemButton selected={item.baseUrl === location.pathname && item.query === location.search}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </NavLink>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
