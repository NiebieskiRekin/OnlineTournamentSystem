import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

// Main App component
export default function App() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      winner: '',
      scoreTeam1: '',
      scoreTeam2: '',
      matchDateTime: null,
    },
  });

  const [submittedData, setSubmittedData] = useState(null);
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false); // State for loading indicator

  // Handle form submission
  const onSubmit = (data) => {
    // Format the date for display
    const formattedData = {
      ...data,
      matchDateTime: data.matchDateTime ? dayjs(data.matchDateTime).format('YYYY-MM-DD HH:mm') : 'N/A',
    };
    setSubmittedData(formattedData);
    console.log('Form Submitted:', formattedData);
    // Optionally, you could send this data to an API or update a parent component
  };

  // Reset form and submitted data
  const handleReset = () => {
    reset();
    setSubmittedData(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
        <Card className="w-full max-w-md shadow-lg rounded-xl">
          <CardContent className="p-6">
            <Typography variant="h5" component="div" className="text-center font-bold text-gray-800 mb-6">
              Edit Match Information
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Who Won */}
              <Controller
                name="winner"
                control={control}
                rules={{ required: 'Winner is required' }}
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined" error={!!errors.winner}>
                    <InputLabel id="winner-label">Who Won?</InputLabel>
                    <Select
                      labelId="winner-label"
                      id="winner"
                      label="Who Won?"
                      {...field}
                      className="rounded-lg"
                    >
                      <MenuItem value=""><em>Select Winner</em></MenuItem>
                      <MenuItem value="Team A">Team A</MenuItem>
                      <MenuItem value="Team B">Team B</MenuItem>
                      <MenuItem value="Draw">Draw</MenuItem>
                    </Select>
                    {errors.winner && (
                      <Typography variant="caption" color="error" className="mt-1">
                        {errors.winner.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Score Team 1 */}
              <Controller
                name="scoreTeam1"
                control={control}
                rules={{
                  required: 'Score for Team 1 is required',
                  pattern: {
                    value: /^\d+$/,
                    message: 'Please enter a valid number',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Score (Team 1)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!errors.scoreTeam1}
                    helperText={errors.scoreTeam1 ? errors.scoreTeam1.message : ''}
                    className="rounded-lg"
                  />
                )}
              />

              {/* Score Team 2 */}
              <Controller
                name="scoreTeam2"
                control={control}
                rules={{
                  required: 'Score for Team 2 is required',
                  pattern: {
                    value: /^\d+$/,
                    message: 'Please enter a valid number',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Score (Team 2)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    error={!!errors.scoreTeam2}
                    helperText={errors.scoreTeam2 ? errors.scoreTeam2.message : ''}
                    className="rounded-lg"
                    inputProps={{ min: 0 }} // Ensure non-negative scores
                  />
                )}
              />

              {/* Match Date Time */}
              <Controller
                name="matchDateTime"
                control={control}
                rules={{ required: 'Match Date & Time is required' }}
                render={({ field }) => (
                  <DateTimePicker
                    label="Match Date & Time"
                    value={field.value}
                    onChange={(newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="outlined"
                        error={!!errors.matchDateTime}
                        helperText={errors.matchDateTime ? errors.matchDateTime.message : ''}
                      />
                    )}
                  />
                )}
              />

              <Box className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleReset}
                  className="px-6 py-2 rounded-lg text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                >
                  Save Match Info
                </Button>
              </Box>
            </form>

            {submittedData && (
              <Box className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Typography variant="h6" className="font-semibold text-blue-800 mb-3">
                  Submitted Data:
                </Typography>
                <Typography variant="body1">
                  <strong>Winner:</strong> {submittedData.winner}
                </Typography>
                <Typography variant="body1">
                  <strong>Score:</strong> {submittedData.scoreTeam1} - {submittedData.scoreTeam2}
                </Typography>
                <Typography variant="body1">
                  <strong>Date/Time:</strong> {submittedData.matchDateTime}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleGenerateCommentary}
                  disabled={isLoadingCommentary}
                  className="mt-4 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-md"
                >
                  {isLoadingCommentary ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    '✨ Generate Match Commentary ✨'
                  )}
                </Button>

                {matchCommentary && (
                  <Box className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Typography variant="h6" className="font-semibold text-yellow-800 mb-2">
                      Match Commentary:
                    </Typography>
                    <Typography variant="body2" className="text-gray-700 whitespace-pre-wrap">
                      {matchCommentary}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </LocalizationProvider>
  );
}
