import React, { useEffect, useState } from 'react';
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
} from '@mui/material';

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
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchParticipants = async () => {
      setLoading(true);
      setError(null);
      try {
        // Adjust the API path if your backend is not served under /api
        const response = await fetch(`/api/tournament/${tournamentId}/participant`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error fetching participants: ${response.statusText}`);
        }
        const result: ParticipantsApiResponse = await response.json();
        setParticipants(result.data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching participants.');
        }
        console.error("Failed to fetch participants:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [tournamentId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><CircularProgress /></div>;
  }

  if (error) {
    return <Alert severity="error" style={{ margin: '20px 0' }}>{error}</Alert>;
  }

  if (participants.length === 0) {
    return <Typography style={{ padding: '20px', textAlign: 'center' }}>No participants found for this tournament.</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="tournament participants table">
        <TableHead>
          <TableRow>
            <TableCell>Participant Name</TableCell>
            <TableCell>License Number</TableCell>
            <TableCell align="right">Score</TableCell>
            <TableCell align="center">Winner</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participants.map((item) => (
            <TableRow key={item.participant.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">{item.user?.name || 'N/A'}</TableCell>
              <TableCell>{item.participant.licenseNumber || 'N/A'}</TableCell>
              <TableCell align="right">{item.participant.score ?? 'N/A'}</TableCell>
              <TableCell align="center">{item.participant.winner === null ? 'N/A' : item.participant.winner ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TournamentParticipantsTable;