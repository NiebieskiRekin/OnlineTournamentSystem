import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
// import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
// import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
// import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
// import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { useLocation, useNavigate } from 'react-router';
import { authClient } from '~/lib/auth';
import { GamepadRounded } from '@mui/icons-material';



// const secondaryListItems = [
//   // { text: 'Settings', icon: <SettingsRoundedIcon /> },
//   // { text: 'About', icon: <InfoRoundedIcon /> },
//   // { text: 'Feedback', icon: <HelpRoundedIcon /> },
// ];

export default function MenuContent() {
  const navigate = useNavigate();
  const session = authClient.useSession()
  // const [selected, setSelected] = React.useState(0);
  const location = useLocation()

  const mainListItems = [
    { text: 'Home', icon: <HomeRoundedIcon />, query: "", baseUrl: "/" },
    { text: 'My Tournaments', icon: <AnalyticsRoundedIcon />, query: `?participant=${session.data?.user.id}`, baseUrl: "/" },
    { text: 'My Games', icon: <GamepadRounded />, query: `?participant=${session.data?.user.id}`, baseUrl: "/matches/"}
    // { text: 'Tasks', icon: <AssignmentRoundedIcon /> },
  ];

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton selected={item.baseUrl === location.pathname && item.query === location.search} onClick={()=>{navigate(item.baseUrl+item.query)}}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List> */}
    </Stack>
  );
}
