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
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery, keepPreviousData, useMutation } from '@tanstack/react-query';
import type { Participant, participantInsertSchema, tournamentInsertSchema } from '@webdev-project/api-client';
import apiClient from '~/lib/api-client';
import { authClient } from '~/lib/auth';
import { queryKeys, parseError } from '~/lib/queries';
import { MaterialReactTable, MRT_EditActionButtons, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import queryClient from '~/lib/query-client';
import {z} from "zod"

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

  const isParticipating = data.find((p)=>p.id == session?.user.id)


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].participant.$delete({
            param: {
                id: id
            }
        });
    
        if (!response.ok){
            parseError(response)
        }

        if (response.status == 200){
            const result = await response.json();
            return result;
        } else {
            throw Error("Something went wrong");
        }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.LIST_PARTICIPANTS(tournamentId.toString()));
    },
    onError: (error: Error) => {
      console.error("Error leaving tournament:", error);
      alert("Error leaving tournament:"+ error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(tournamentId.toString());
  };


    const createMutation = useMutation({
      mutationFn: async (id: string,  payload: z.infer<typeof participantInsertSchema>) => {
          const response = await apiClient.api.tournament[':id{[0-9]+}'].participant.$post({
              param: {
                  id: id
              },
              json: payload
          });
      
          if (!response.ok){
              parseError(response)
          }
  
          if (response.status == 200){
              const result = await response.json();
              return result;
          } else {
              throw Error("Something went wrong");
          }
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(queryKeys.LIST_PARTICIPANTS(tournamentId.toString()));
        console.log("created");
      },
      onError: (error: Error) => {
        console.error("Error leaving tournament:", error);
        alert("Error leaving tournament:"+ error.message);
      },
    });
  
    const handleCreate = () => {
        deleteMutation.mutate(tournamentId.toString(),{});
    };

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
        { isParticipating ? (
         <Tooltip arrow title={"Leave"}>
            <IconButton onClick={() =>handleDelete()}>
                <ExitToAppIcon/>
            </IconButton>
         </Tooltip>
        )
         : (
            <Tooltip arrow title={"Join"}>
            <IconButton onClick={() =>table.setCreatingRow(true)}>
                <AddIcon/>
            </IconButton>
            </Tooltip>
         )

        }
        </Box>
    ),
    renderCreateRowDialogContent: ({table,row,internalEditComponents})=>(
     <>
        <DialogTitle variant="h3">Join tournament</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {internalEditComponents}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
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