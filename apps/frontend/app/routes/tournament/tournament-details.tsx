import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import GeneratingTokensIcon from '@mui/icons-material/GeneratingTokens';
import {
    queryKeys,
    parseError,
} from "../../lib/queries";
import apiClient from '~/lib/api-client';
import { authClient } from '~/lib/auth';
import { useParams, Link as RouterLink } from 'react-router';
import { sponsorLogos } from '@webdev-project/api-client';
import {z} from "zod";
import TournamentParticipantsTable from '~/components/ParticipantsTable'; // Adjust path as needed


interface TournamentDetailsPageProps {
  onClose?: () => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY as string;

const TournamentDetailsPage: React.FC<TournamentDetailsPageProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { id } = useParams();
  const [parsedSponsorLogos, setParsedSponsorLogos] = useState<z.infer<typeof sponsorLogos>>([])

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { data: tournamentData, isLoading: isLoadingTournament, error: fetchError, refetch } = useQuery({
    queryKey: queryKeys.LIST_TOURNAMENT(id ?? "").queryKey,
    queryFn: async () => {
        setParsedSponsorLogos([])
        console.log(id)
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
            if (result.sponsorLogos){
              const logos = await sponsorLogos.spa(JSON.parse(result.sponsorLogos));
              if (logos.success){
                setParsedSponsorLogos(logos.data)
              } else {
                alert(logos.error)
              }
            }
            return result;
          } else {
            throw Error("Something went wrong");
          }
      },
  });

  const isOrganizer = session?.user?.id === tournamentData?.organizerId

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const response = await apiClient.api.tournament[':id{[0-9]+}'].$delete({
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
    await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENTS);
    if (id) {
        queryClient.removeQueries(queryKeys.LIST_TOURNAMENT(id));
    } 
      setOpenDeleteDialog(false);
      onClose?.();
    },
    onError: (error: Error) => {
      console.error("Error deleting tournament:", error);
      setOpenDeleteDialog(false);
    },
  });

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const generateTournamentMatchesMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.api.tournament[':id{[0-9]+}'].generate_matches.$post({
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
    onSuccess: async (result) => {
        if (id) {
          await queryClient.invalidateQueries(queryKeys.LIST_TOURNAMENT(id));
          queryClient.removeQueries(queryKeys.LIST_TOURNAMENT(id));
        }
        console.log(result.message)
        alert(result.message)
      },
      onError: (error: Error) => {
        console.error("Error generating matches:", error);
        alert(`Error generating matches: ${error.message}`);
      },
  })

  const handleGenerateMatches = () => {
    if (id) {
      generateTournamentMatchesMutation.mutate(id);
    }
  };

  useEffect(() => {
    void refetch();
  }, [id, refetch]);

  if (isLoadingTournament) return <CircularProgress />;
  if (fetchError) return <Typography color="error">Error loading tournament: {fetchError.message}</Typography>;
  if (!tournamentData) return <Typography>Tournament not found.</Typography>;



  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Grid size={{xs: 12, sm: 6}}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body1">
        {value ?? 'N/A'}
      </Typography>
    </Grid>
  );

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {tournamentData.name}
          </Typography>
          <Box>
            <Button
              component={RouterLink}
              to={`/tournament/${id}/edit`}
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              disabled={!isOrganizer || deleteMutation.isPending}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={!isOrganizer || deleteMutation.isPending}
              onClick={() => setOpenDeleteDialog(true)}
              startIcon={<DeleteIcon />}
              sx={{ mr: 1 }}
            >
              Delete
            </Button>
            <Button 
              variant="outlined"
              color="secondary"
              startIcon={<GeneratingTokensIcon />}
              disabled={!isOrganizer || deleteMutation.isPending || generateTournamentMatchesMutation.isPending || tournamentData.groupsCreated}
              onClick={handleGenerateMatches}
              sx={{ mr: 1 }}
            >
              {generateTournamentMatchesMutation.isPending ? <CircularProgress size={20} /> : 'Generate Matches'}
            </Button>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <DetailItem label="Discipline" value={tournamentData.discipline} />
          <DetailItem label="Organizer" value={tournamentData.organizer} />
          <DetailItem label="Tournament Time" value={tournamentData.time ? new Date(tournamentData.time).toLocaleString() : 'N/A'} />
          <DetailItem label="Application Deadline" value={tournamentData.applicationDeadline ? new Date(tournamentData.applicationDeadline).toLocaleString() : 'N/A'} />
          <DetailItem label="Max Participants" value={tournamentData.maxParticipants} />
          {/* <DetailItem label="Current Participants" value={tournamentData.participants ?? 0} /> */}
          <DetailItem label="Location" value={tournamentData.location} />
        </Grid>

        {/* {tournamentData.location && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
              <iframe
                title="Tournament Location"
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: '4px' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${tournamentData.location.trim()}`}
              ></iframe>
          </Box>
        )} */}
        <Divider sx={{ my: 2 }} />

        <TournamentParticipantsTable tournamentId={tournamentData.id} />

        {(parsedSponsorLogos.length ?? 0) > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Sponsors
            </Typography>
            <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
              {parsedSponsorLogos.map((logo) => (
                <ImageListItem key={logo}>
                  <img
                    src={logo}
                    loading='lazy'
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}
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

export default TournamentDetailsPage;
