/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tournamentInsertSchema, tournamentUpdateSchema, type Tournament } from '@webdev-project/api-client';
import {
    queryKeys,
    parseError,
} from "../lib/queries"; // Adjust path as necessary
import apiClient from '~/lib/api-client';

const formValidationSchema = tournamentInsertSchema.pick({
    name: true,
    discipline: true,
    time: true,
    latitude: true,
    longitude: true,
    placeid: true,
    maxParticipants: true,
    applicationDeadline: true,
});
type TournamentFormData = z.infer<typeof formValidationSchema>;

interface TournamentFormPageProps {
  tournamentId?: string;
  onClose?: () => void;
}

const TournamentFormPage: React.FC<TournamentFormPageProps> = ({ tournamentId, onClose }) => {
  const queryClient = useQueryClient();
  const isEditMode = tournamentId !== undefined;

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { data: tournamentData, isLoading: isLoadingTournament, error: fetchError } = useQuery({
    queryKey: queryKeys.LIST_TOURNAMENT(tournamentId ?? "").queryKey,
    queryFn: async () => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].$get({
            param: {
                id: tournamentId ?? ""
            }
        })
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
    enabled: isEditMode, 
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TournamentFormData>({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      name: '',
      discipline: undefined,
      time: null,
      latitude: null,
      longitude: null,
      placeid: '',
      maxParticipants: 10,
      applicationDeadline: null,
    },
  });

  useEffect(() => {
    if (isEditMode && tournamentData) {
      const formData: Partial<TournamentFormData> = {
        name: tournamentData.name,
        discipline: tournamentData.discipline,
        time: tournamentData.time ? new Date(tournamentData.time) : null,
        latitude: tournamentData.latitude,
        longitude: tournamentData.longitude,
        placeid: tournamentData.placeid,
        maxParticipants: tournamentData.maxParticipants,
        applicationDeadline: tournamentData.applicationDeadline ? new Date(tournamentData.applicationDeadline) : null,
      };
      reset(formData);
    } else if (!isEditMode) {
      reset({ // Reset to default for create mode
        name: '', discipline: undefined, time: null,
        latitude: null, longitude: null, placeid: '',
        maxParticipants: 10, applicationDeadline: null,
      });
    }
  }, [tournamentData, isEditMode, reset]);

  const createMutation = useMutation(
    { mutationFn: async (payload: z.infer<typeof tournamentInsertSchema>) => {
        const response = await apiClient.api.tournament.$post({
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
    await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENTS);
    console.log("created")
    onClose?.();
    },
    onError: (error: Error) => {
    console.error("Error creating tournament:", error);
    // Show error message to user
    alert(`Error creating tournament: ${error.message}`);
    },
    });

  const updateMutation = useMutation({
    mutationFn: async (tournament: z.infer<typeof tournamentUpdateSchema>) => {
    const response = await apiClient.api.tournament.$patch({
        json: tournament
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
    onSuccess: async (data: Tournament) => {
        await Promise.allSettled([
            queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENT(data.id.toString())),
            queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENTS)
        ]).finally(()=>{
            onClose?.()
            console.log("updated")
        })
    },
    onError: (error: Error) => {
      console.error("Error updating tournament:", error);
      alert(`Error updating tournament: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].$delete({
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
    await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENTS);
    if (tournamentId) {
        queryClient.removeQueries(queryKeys.LIST_TOURNAMENT(tournamentId.toString()));
    } 
      setOpenDeleteDialog(false);
      onClose?.();
    },
    onError: (error: Error) => {
      console.error("Error deleting tournament:", error);
      setOpenDeleteDialog(false);
    },
  });

  const onSubmit: SubmitHandler<TournamentFormData> = async (formData) => {
    if (isEditMode && tournamentData) {
      const payload: z.infer<typeof tournamentUpdateSchema> = {
        id: tournamentData.id,
        name: formData.name,
        discipline: Number(formData.discipline),
        time: formData.time,
        latitude: formData.latitude,
        longitude: formData.longitude,
        placeid: formData.placeid,
        maxParticipants: Number(formData.maxParticipants),
        applicationDeadline: formData.applicationDeadline,
      };
      await updateMutation.mutateAsync(payload);
    } else {
      const createPayload: z.infer<typeof tournamentInsertSchema> = {
        name: formData.name,
        discipline: Number(formData.discipline),
        time: formData.time,
        latitude: formData.latitude,
        longitude: formData.longitude,
        placeid: formData.placeid,
        maxParticipants: Number(formData.maxParticipants),
        applicationDeadline: formData.applicationDeadline,
      };
      await createMutation.mutateAsync(createPayload);
    }
  };

  const handleDelete = () => {
    if (tournamentId) {
      deleteMutation.mutate(tournamentId);
    }
  };

  if (isEditMode && isLoadingTournament) return <CircularProgress />;
  if (fetchError) return <Typography color="error">Error loading tournament: {fetchError.message}</Typography>;
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Tournament' : 'Create New Tournament'}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {isEditMode && tournamentData?.organizer && (
              <Grid size={{xs: 12}}>
                <Typography component="div" variant="body1" gutterBottom sx={{ mb: 1 }}>
                  <strong>Organizer ID:</strong> {tournamentData.organizer}
                </Typography>
              </Grid>
            )}
            <Grid size={{xs: 12}}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                 <TextField {...field} label="Tournament Name*" fullWidth error={!!errors.name} helperText={errors.name?.message} />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="discipline"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Discipline ID*"
                    type="number"
                    fullWidth
                    error={!!errors.discipline}
                    helperText={errors.discipline?.message || "Enter the numeric ID of the discipline."}
                    onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="maxParticipants"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Max Participants*"
                    type="number"
                    fullWidth
                    error={!!errors.maxParticipants}
                    helperText={errors.maxParticipants?.message}
                    onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                  />
                )}
              />
            </Grid>
             <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="time"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Tournament Date/Time"
                    renderInput={(params) => <TextField {...params} fullWidth error={!!errors.time} helperText={errors.time?.message} />}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="applicationDeadline"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    label="Application Deadline"
                    renderInput={(params) => <TextField {...params} fullWidth error={!!errors.applicationDeadline} helperText={errors.applicationDeadline?.message} />}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="latitude"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Latitude"
                    type="number"
                    fullWidth
                    error={!!errors.latitude}
                    helperText={errors.latitude?.message}
                    onChange={e => field.onChange(parseFloat(e.target.value) || null)}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="longitude"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Longitude"
                    type="number"
                    fullWidth
                    error={!!errors.longitude}
                    helperText={errors.longitude?.message}
                    onChange={e => field.onChange(parseFloat(e.target.value) || null)}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="placeid"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Place ID (e.g., Google Place ID)" fullWidth error={!!errors.placeid} helperText={errors.placeid?.message} />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : (isEditMode ? <SaveIcon /> : <AddIcon />) }
            >
              {isEditMode ? 'Save Changes' : 'Create Tournament'}
            </Button>
            {isEditMode && (
              <Button
                variant="outlined"
                color="error"
                disabled={deleteMutation.isPending}
                onClick={() => setOpenDeleteDialog(true)}
                startIcon={deleteMutation.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                Delete Tournament
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this tournament? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TournamentFormPage;

