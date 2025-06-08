import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Alert,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Participant } from '@webdev-project/api-client';
import apiClient from '~/lib/api-client';
import { authClient } from '~/lib/auth';
import { queryKeys, parseError } from '~/lib/queries';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';

// This interface defines the structure of individual items in the 'data' array
// returned by your /tournament/:id/participant endpoint.
interface ParticipantEntry {
  participant: {
    id: number; // Assuming 'id' is the primary key of the participant entry
    score: number | null;
    winner: boolean | null;
    licenseNumber: string | null;
    // Add other fields from the 'participant' table if needed
  };
  user: {
    name: string | null;
    // Add other fields from the 'user' table if needed (e.g., user.id)
  };
}

// This interface defines the overall structure of the API response.
interface ParticipantsApiResponse {
  data: ParticipantEntry[];
  meta: {
    totalCount: number;
  };
}

interface TournamentParticipantsTableProps {
  tournamentId: number;
}

const TournamentParticipantsTable: React.FC<TournamentParticipantsTableProps> = ({ tournamentId }) => {
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
      queryKeys.LIST_PARTICIPANTS(tournamentId.toString())
    ],
    queryFn: async () => {
      const response = await apiClient.api.tournament[':id{[0-9]+}'].participant.$get({
        param: {
          id: tournamentId.toString()
        }
      });
  
      if (!response.ok){
          parseError(response)
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

  const columns = useMemo<MRT_ColumnDef<Participant>[]>(
    () => [
        {
        accessorKey: 'user',
        header: 'Name',
      },
      {
        accessorKey: 'licenseNumber',
        header: 'License Number',
      },
      {
        accessorKey: 'score',
        header: 'Score',
      },
      {
        accessorKey: 'winner',
        header: 'Winner',
      },
    ],[]
  );

  const table = useMaterialReactTable({
    columns,
    data: data,
    initialState: { showColumnFilters: true },
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    state: {
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
    },
    renderTopToolbarCustomActions: () => (
        <Box>
        <Tooltip arrow title="Refresh Data">
            <IconButton onClick={() => refetch()}>
            <RefreshIcon />
            </IconButton>
        </Tooltip>
        <Tooltip arrow title="Join">
            <IconButton onClick={() =>console.log("create")}>
            <AddIcon/>
            </IconButton>
        </Tooltip>
        </Box>
    ),
    rowCount: meta?.totalCount ?? 0,
  })

  return (
    <Box sx={{ width: '100%' }}>
    <Typography component="h4">
      Participants
    </Typography>
    {isError && <Alert severity="error">{error.message}</Alert>}
    <MaterialReactTable table={table} />
  </Box>
  );
};

export default TournamentParticipantsTable;