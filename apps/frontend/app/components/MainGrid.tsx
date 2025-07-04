/* eslint-disable @typescript-eslint/no-misused-promises */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import { Alert, IconButton, MenuItem, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import {type Tournament} from "@webdev-project/api-client";
import apiClient from '~/lib/api-client';
import { parseError, queryKeys } from '~/lib/queries';
import AddIcon from '@mui/icons-material/Add';
import { NavLink } from 'react-router';
import { authClient } from '~/lib/auth';

export default function MainGrid({participant} : {participant: string|null}) {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([],);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const { data: session } = authClient.useSession();

  const {
    data: { data = [], meta } = {},
    error,
    isError,
    isRefetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      participant ? queryKeys.LIST_TOURNAMENTS_FOR_USER(participant).queryKey : queryKeys.LIST_TOURNAMENTS.queryKey,
      {
        columnFilters,
        globalFilter,
        pagination,
        sorting,
      },
    ],
    queryFn: async () => {
      const response = await apiClient.api.tournament.$get({
        query: {
          columnFilters: JSON.stringify(columnFilters),
          globalFilter,
          sorting: JSON.stringify(sorting),
          pageIndex: pagination.pageIndex.toString(),
          pageSize: pagination.pageSize.toString(),
          participant: participant ?? undefined
        }
      });
  
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

  const columns = useMemo<MRT_ColumnDef<Tournament>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'discipline',
        header: 'Discipline',
      },
      {
        accessorKey: 'organizer',
        header: 'Organizer',
      },
      {
        accessorKey: 'time',
        header: 'Time',
        filterVariant: 'date',
        Cell: ({ cell }) => {
          if (cell.getValue() != null)
            return new Date(cell.getValue<Date>()).toLocaleString()
          return null
        },
        enableGlobalFilter: false,
        filterFn: 'greaterThan',
      },
      {
        accessorKey: 'maxParticipants',
        header: 'Max participants',
      },
      {
        accessorKey: 'applicationDeadline',
        header: 'Application deadline',
        filterVariant: 'date',
        Cell: ({ cell }) => {
          if (cell.getValue() != null)
            return new Date(cell.getValue<Date>()).toLocaleString()
          return null
        },
        enableGlobalFilter: false,
        filterFn: 'greaterThan',
      }
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: data,
    initialState: { showColumnFilters: true },
    manualFiltering: true, //turn off built-in client-side filtering
    manualPagination: true, //turn off built-in client-side pagination
    manualSorting: true, //turn off built-in client-side sorting
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    renderTopToolbarCustomActions: () => (
      <Box>
        <Tooltip arrow title="Refresh Data">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip arrow title="Create a new tournament">
          <NavLink to="/tournament/create">
            <IconButton onClick={()=>{}}>
              <AddIcon/>
            </IconButton>
          </NavLink>
        </Tooltip>
      </Box>
    ),
    rowCount: meta?.totalCount ?? 0,
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
      sorting,
    },
    enableRowActions: true,
    renderRowActionMenuItems: ({ row }) => [
      <MenuItem key="details" disabled={isLoading}>
          <NavLink to={`/tournament/${row.original.id}`}>
            Details
          </NavLink>
      </MenuItem>,
      <MenuItem key='edit' disabled={isLoading || (!session) || (session.user.id !== data[row.index].organizerId)}>
        <NavLink to={`/tournament/${row.original.id}/edit`}>
          Edit
        </NavLink>
      </MenuItem>
    ],
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Upcoming tournaments { participant ? 'for me' : ''}
      </Typography>
      {isError && <Alert severity="error">{error.message}</Alert>}
      <MaterialReactTable table={table} />
    </Box>
  );
}

