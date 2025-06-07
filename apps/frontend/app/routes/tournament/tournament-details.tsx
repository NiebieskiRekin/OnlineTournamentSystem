/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
    queryKeys,
    parseError,
} from "../../lib/queries"; // Adjust path as necessary
import apiClient from '~/lib/api-client';
import { createAuthClient } from 'better-auth/react';
import { useParams } from 'react-router';

interface TournamentFormPageProps {
  onClose?: () => void;
}

const TournamentFormPage: React.FC<TournamentFormPageProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { useSession } = createAuthClient();
  const { tournamentId } = useParams();

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

  const handleDelete = () => {
    if (tournamentId) {
      deleteMutation.mutate(tournamentId);
    }
  };

  if (isLoadingTournament) return <CircularProgress />;
  if (fetchError) return <Typography color="error">Error loading tournament: {fetchError.message}</Typography>;
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tournament details
        </Typography>
        <p>{tournamentId + ": " + JSON.stringify(tournamentData)}</p>
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

