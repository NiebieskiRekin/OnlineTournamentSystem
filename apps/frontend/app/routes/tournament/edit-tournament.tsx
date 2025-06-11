/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useEffect } from 'react';
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
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { tournamentInsertSchema, tournamentUpdateSchema, type Tournament } from '@webdev-project/api-client';
import {
    queryKeys,
    parseError,
} from "../../lib/queries"; // Adjust path as necessary
import apiClient from '~/lib/api-client';
import { useParams } from 'react-router';
import { useSnackbar } from 'notistack';

const formValidationSchema = tournamentInsertSchema.pick({
    name: true,
    discipline: true,
    time: true,
    location: true,
    maxParticipants: true,
    applicationDeadline: true,
    participants: true,
    sponsorLogos: true
});
type TournamentFormData = z.infer<typeof formValidationSchema>;

interface TournamentFormPageProps {
  onClose?: () => void;
}

const TournamentFormPage: React.FC<TournamentFormPageProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const { data: tournamentData, isLoading: isLoadingTournament, error: fetchError } = useQuery({
    queryKey: queryKeys.LIST_TOURNAMENT(id ?? "").queryKey,
    queryFn: async () => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].$get({
            param: {
                id: id ?? ""
            }
        })
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
  });

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TournamentFormData>({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      name: '',
      discipline: undefined,
      time: undefined,
      location: '',
      maxParticipants: 10,
      applicationDeadline: undefined,
      participants: 0,
      sponsorLogos: ""
    },
  });

  useEffect(() => {
    if (tournamentData) {
      const formData: Partial<TournamentFormData> = {
        name: tournamentData.name,
        discipline: tournamentData.discipline,
        time: tournamentData.time ? new Date(tournamentData.time) : undefined,
        location: tournamentData.location,
        maxParticipants: tournamentData.maxParticipants,
        applicationDeadline: tournamentData.applicationDeadline ? new Date(tournamentData.applicationDeadline) : undefined,
        participants: tournamentData.participants,
        sponsorLogos: tournamentData.sponsorLogos
      };
      reset(formData);
    }
  }, [tournamentData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (tournament: z.infer<typeof tournamentUpdateSchema>) => {
    const response = await apiClient.api.tournament.$patch({
        json: tournament
      });
    
      if (!response.ok){
        const result = await response.json();
        parseError(result)
      }

      if (response.status == 200){
        const result = await response.json();
        return {...result, time: new Date(Date.parse(result.time!)), applicationDeadline: result.applicationDeadline ? new Date(Date.parse(result.applicationDeadline)) : null};
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
      enqueueSnackbar("Error updating tournament: "+error.message, { variant: 'error' });
    },
  });

  const onSubmit: SubmitHandler<TournamentFormData> = async (formData) => {
    if (tournamentData) {
      const payload: z.infer<typeof tournamentUpdateSchema> = {
        id: tournamentData.id,
        ...formData
      };
      await updateMutation.mutateAsync(payload);
    }
  };

  if (isLoadingTournament) return <CircularProgress />;
  if (fetchError) return <Typography color="error">Error loading tournament: {fetchError.message}</Typography>;
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          {'Edit Tournament'}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid size={{xs: 12}}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                 <TextField {...field} label="Tournament Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
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
                    label="Discipline" fullWidth error={!!errors.discipline} helperText={errors.discipline?.message}
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
                    label="Max Participants"
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
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    {...field}
                    value={field.value}
                    label="Time"
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                        onBlur: field.onBlur,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="applicationDeadline"
                control={control}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    {...field}
                    value={field.value}
                    label="Application deadline"
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                        onBlur: field.onBlur,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Location" fullWidth error={!!errors.location} helperText={errors.location?.message} />
                )}
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
              <Controller
                name="sponsorLogos"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Sponsor logos" fullWidth error={!!errors.sponsorLogos} helperText={errors.sponsorLogos?.message} />
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || updateMutation.isPending}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon /> }
            >
              {'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default TournamentFormPage;

