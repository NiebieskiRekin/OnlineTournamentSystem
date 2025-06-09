import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { useSearchParams } from 'react-router';
import GamesTable from '~/components/GamesTable';

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
      <GamesTable participant={search.get("participant")}/>
  </Box>
  );
}
