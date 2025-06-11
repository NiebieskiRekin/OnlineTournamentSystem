/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useMemo } from 'react';
import {
  Typography,
  Alert,
  Box,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useQuery, keepPreviousData, useMutation } from '@tanstack/react-query';
import { participantInsertSchema, type Participant } from '@webdev-project/api-client';
import apiClient from '~/lib/api-client';
import { authClient } from '~/lib/auth';
import { queryKeys, parseError } from '~/lib/queries';
import { MaterialReactTable, MRT_EditActionButtons, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import queryClient from '~/lib/query-client';
import {z} from "zod"
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';

interface TournamentParticipantsTableProps {
  tournamentId: number;
}

type ParticipantFormData = z.infer<typeof participantInsertSchema>;

const TournamentParticipantsTable: React.FC<TournamentParticipantsTableProps> = ({ tournamentId }) => {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar();

  const {
    data: { data = [], meta } = {},
    error,
    isError,
    isRefetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.LIST_PARTICIPANTS(tournamentId.toString()).queryKey,
    queryFn: async () => {
      const response = await apiClient.api.tournament[':id{[0-9]+}'].participant.$get({
        param: {
          id: tournamentId.toString()
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
            const result = await response.json();
            parseError(result)
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
      await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENT(tournamentId.toString()));
      enqueueSnackbar("Tournament left successfully", { variant: 'success' });
    },
    onError: (error: Error) => {
      console.error("Error leaving tournament:", error);
      enqueueSnackbar("Error leaving tournament: "+ error.message, { variant: 'error' });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(tournamentId.toString());
  };


    const createMutation = useMutation({
      mutationFn: async (payload: ParticipantFormData) => {
          const response = await apiClient.api.tournament[':id{[0-9]+}'].participant.$post({
              param: {
                  id: tournamentId.toString()
              },
              json: payload
          });
      
          if (!response.ok){
            const result = await response.json();
            parseError(result)
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
        // Also invalidate the main tournament query to update participant counts if displayed elsewhere
        await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENT(tournamentId.toString()));
        enqueueSnackbar("Joined tournament", { variant: 'success' });
      },
      onError: (error: Error) => {
        console.error("Error joining tournament:", error);
        enqueueSnackbar("Error joining tournament: "+ error.message, { variant: 'error' });
      },
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
    ],[]
  );

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ParticipantFormData>({
      resolver: zodResolver(participantInsertSchema),
      defaultValues: {
        licenseNumber: '',
        score: 0,
      },
    });

    // This is the core submission logic, called by react-hook-form's handleSubmit after validation.
    // It handles the mutation, and on success, closes the dialog and resets the form.
    const onSubmit: SubmitHandler<ParticipantFormData> = async (formData) => {
        try {
            await createMutation.mutateAsync(formData);
            // createMutation.onSuccess handles query invalidation.
            table.setCreatingRow(null); // Close the MRT dialog/creating state.
            reset(); // Reset the RHF form to default values.
        } catch (error) {
            console.error("Error during form submission via onSubmit:", error);
        }
    }

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
      isSaving: isSubmitting || createMutation.isPending
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
            <IconButton onClick={async () =>{
                if (!session){
                    await navigate("/login")
                } else {
                    table.setCreatingRow(true)
                }
            }}>
                <AddIcon/>
            </IconButton>
            </Tooltip>
         )

        }
        </Box>
    ),
    onCreatingRowCancel: () => reset({
      licenseNumber: '',
      score: 0,
    }),
    onCreatingRowSave: () => handleSubmit(onSubmit)(),
    renderCreateRowDialogContent: ({table,row})=>(
     <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle variant="h6">Join tournament</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '10px'}}
        >
        <Controller
            name="licenseNumber"
            control={control}
            render={({ field }) => (
                <TextField {...field} label="License Number" fullWidth error={!!errors.licenseNumber} helperText={errors.licenseNumber?.message} />
            )}
            />
        <Controller
            name="score"
            control={control}
            render={({ field }) => (
                <TextField  {...field} type="number" label="score" fullWidth error={!!errors.score} helperText={errors.score?.message} onChange={e => field.onChange(parseInt(e.target.value) || null)}/>
            )}
        />
        {/* <Controller
            name="winner"
            control={control}
            render={({ field }) => (
                <TextField {...field} label="Winner" fullWidth error={!!errors.winner} helperText={errors.winner?.message} />
            )}
        /> */}
        </DialogContent>
        <DialogActions>
            <MRT_EditActionButtons variant="text" table={table} row={row}/>
        </DialogActions>
      </form>
    ),
    rowCount: meta?.totalCount ?? 0,
  })

  return (
    <Box sx={{ width: '100%' }}>
    <Typography component="h4">
      Participants {`(${data.length} / ${meta?.maxParticipants ?? '∞'})`}
    </Typography>
    {isError && <Alert severity="error">{error.message}</Alert>}
    <MaterialReactTable table={table} />
  </Box>
  );
};

export default TournamentParticipantsTable;