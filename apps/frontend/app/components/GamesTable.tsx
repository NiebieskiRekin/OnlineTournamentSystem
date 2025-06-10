/* eslint-disable @typescript-eslint/no-misused-promises */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from 'material-react-table';
import { Alert, IconButton, MenuItem, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import apiClient from '~/lib/api-client';
import { parseError, queryKeys } from '~/lib/queries';
import { useNavigate } from 'react-router';

type MatchData = {
  id: number;
  level: number;
  winner: string | null;
  tournamentId: number;
  tournament: string;
  time: string | null;
  participants: string;
}

export default function GamesTable({participant} : {participant: string|null}) {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const {
    data: { data = [], meta } = {},
    error,
    isError,
    isRefetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      participant ? queryKeys.LIST_MATCH(participant) : queryKeys.LIST_MATCHES,
      {
        pagination,
      },
    ],
    queryFn: async () => {
      const response = await apiClient.api.match.$get({
        query: {
          pageIndex: pagination.pageIndex.toString(),
          pageSize: pagination.pageSize.toString(),
          user: participant ?? undefined
        }
      })
  
      if (!response.ok){
        const result = await response.json();
        parseError(result)
      }
  
      if (response.ok){
        const result = await response.json();
        return result;
      } else {
        throw Error("Something went wrong");
      }
    },
    placeholderData: keepPreviousData,
    throwOnError: (error) => error.response?.status >= 500,
  });

  const columns = useMemo<MRT_ColumnDef<MatchData>[]>(
    () => [
      {
        accessorKey: "level",
        header: "Level",
        filterVariant: "range"
      },
      {
        accessorKey: "tournament",
        header: "Tournament",
        filterVariant: "text",
      },
      {
        accessorKey: "time",
        header: "Time",
        filterVariant: "datetime-range",
        // Cell: ({ cell }) => {new Date(cell.getValue<Date>()).toLocaleString()},
      },
      {
        accessorKey: "winner",
        header: "Winner",
        filterVariant: "text",
      },
      {
        accessorKey: "participants",
        header: "Other participants",
        filterVariant: "text",
      }
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: data,
    manualPagination: true, //turn off built-in client-side pagination
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    onPaginationChange: setPagination,
    renderTopToolbarCustomActions: () => (
      <Box>
        <Tooltip arrow title="Refresh Data">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        {/* <Tooltip arrow title="Create a new tournament">
          <IconButton onClick={() => navigate('/tournament/create')}>
            <AddIcon/>
          </IconButton>
        </Tooltip> */}
      </Box>
    ),
    rowCount: meta?.totalCount ?? 0,
    state: {
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
    },
    enableRowActions: true,
    renderRowActionMenuItems: ({ row }) => [
      <MenuItem key="details" onClick={() => navigate(`/tournament/${row.original.tournamentId}`)} disabled={isLoading}>
        Tournament Details
      </MenuItem>,
    ],
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Upcoming games { participant ? 'for me' : ''}
      </Typography>
      {isError && <Alert severity="error">{error.message}</Alert>}
      <MaterialReactTable table={table} />
    </Box>
  );
}

