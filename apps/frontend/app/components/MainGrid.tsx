import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
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
import { Alert, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import {type Tournament, tournamentList} from "@webdev-project/api-client";
import apiClient from '~/lib/api-client';
import {z} from "zod";
import { parseError } from '~/lib/queries';

type TournamentList = z.infer<typeof tournamentList> 

export default function MainGrid() {
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([],);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
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
  } = useQuery<TournamentList>({
    queryKey: [
      'list-tournaments"',
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
          columnFilters: JSON.stringify(columnFilters) ?? [],
          globalFilter,
          sorting: JSON.stringify(sorting) ?? [],
          pageIndex: pagination.pageIndex.toString(),
          pageSize: pagination.pageSize.toString()
        }
      });
  
      if (!response.ok){
          parseError(response)
      }
  
      if (response.ok){
        const result: TournamentList = tournamentList.parse(await response.json());
        return result;
      } else {
        throw Error("Something went wrong");
      }
    },
    placeholderData: keepPreviousData,
    throwOnError: (error) => error.response?.status >= 500,
  });

  const columns = useMemo<MRT_ColumnDef<Tournament>[]>(
    // id: number;
    // name: string;
    // discipline: number;
    // organizer: string;
    // createdAt: Date;
    // updatedAt: Date;
    // time: Date | null;
    // latitude: number | null;
    // longitude: number | null;
    // placeid: string | null;
    // maxParticipants: number;
    // applicationDeadline: Date | null;
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
      },
      // {
      //   accessorFn: (row) => new Date(row.lastLogin),
      //   id: 'lastLogin',
      //   header: 'Last Login',
      //   Cell: ({ cell }) => new Date(cell.getValue<Date>()).toLocaleString(),
      //   filterFn: 'greaterThan',
      //   filterVariant: 'date',
      //   enableGlobalFilter: false,
      // },
    ],
    [],
    //end
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
      <Tooltip arrow title="Refresh Data">
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
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
  });

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Upcoming tournaments
      </Typography>
      {isError && <Alert severity="error">{error.message}</Alert>}
      <MaterialReactTable table={table} />;
    </Box>
  );
}

