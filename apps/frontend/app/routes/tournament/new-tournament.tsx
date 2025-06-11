/* eslint-disable @typescript-eslint/no-misused-promises */
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Add as AddIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { tournamentInsertSchema} from '@webdev-project/api-client';
import {
    queryKeys,
    parseError,
} from "../../lib/queries";
import apiClient from '~/lib/api-client';
import  { useSnackbar } from 'notistack';

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
  const { enqueueSnackbar } = useSnackbar();

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TournamentFormData>({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      name: undefined,
      discipline: undefined,
      time: undefined,
      location: '',
      maxParticipants: 10,
      applicationDeadline: undefined,
      participants: 0,
      sponsorLogos: undefined
    },
  });

  const createMutation = useMutation(
    { mutationFn: async (payload: z.infer<typeof tournamentInsertSchema>) => {
        const response = await apiClient.api.tournament.$post({
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
      await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENTS);
      console.log("Tournament created successfully")
      enqueueSnackbar("Tournament created successfully", { variant: 'success' });
      onClose?.();
      
    },
    onError: (error: Error) => {
      console.error("Error creating tournament:", error);
      // Show error message to user
      enqueueSnackbar(`Error creating tournament: ${error.message}`, {variant: "error"});
      },
    });

  const onSubmit: SubmitHandler<TournamentFormData> = async (formData) => {
    const createPayload: z.infer<typeof tournamentInsertSchema> = formData;
    await createMutation.mutateAsync(createPayload);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create a new tournament
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
              disabled={isSubmitting || createMutation.isPending}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : (<AddIcon />) }
            >
              {'Create Tournament'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default TournamentFormPage;

