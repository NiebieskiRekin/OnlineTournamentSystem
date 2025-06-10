import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
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
import {matchParticipantStateSchema} from "@webdev-project/api-client";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseError, queryKeys } from '~/lib/queries';
import { useMutation } from '@tanstack/react-query';
import queryClient from '~/lib/query-client';
import apiClient from '~/lib/api-client';

const StatusesValues = ["WON", "LOST", "NOT_PLAYED"]

const formSchema = z.object({
    score: z.number().optional(),
    status: matchParticipantStateSchema,
})

export default function MatchForm({ id, participant}: { id: number, participant: number}) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      score: undefined,
      status: "NOT_PLAYED",
    },
  });

    const updateMutation = useMutation(
    { mutationFn: async (payload: z.infer<typeof formSchema>) => {
        const response = await apiClient.api.match[':id{[0-9]+}'].$post({
            param: {
                id: id.toString()
            },
            json: {...payload,participant: participant}
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
    onSuccess: async () => {
        await queryClient.invalidateQueries(queryKeys.LIST_MATCHES);
        console.log("updated match")
    },
    onError: (error: Error) => {
        console.error("Error updating match:", error);
        // Show error message to user
        alert(`Error updating match: ${error.message}`);
    },
    });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    await updateMutation.mutateAsync(data);
    console.log('Form Submitted:', data);
  };

  // Reset form and submitted data
  const handleReset = () => {
    reset();
  };

  return (
    <Card>
        <CardContent>
        <Typography variant="h5" component="div">
            Edit Match Information
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
            name="status"
            control={control}
            rules={{ required: 'Status is requried' }}
            render={({ field }) => (
                <FormControl fullWidth variant="outlined" error={!!errors.status}>
                <InputLabel id="winner-label">Who Won?</InputLabel>
                <Select
                    labelId="winner-label"
                    id="winner"
                    label="Who Won?"
                    {...field}
                    className="rounded-lg"
                >
                    {StatusesValues.map((value) => (
                        <MenuItem key={value} value={value}>
                            {value}
                        </MenuItem>
                    ))}
                </Select>
                {errors.status && (
                    <Typography variant="caption" color="error" className="mt-1">
                        {errors.status!.message! ?? "Error!"}
                    </Typography>
                )}
                </FormControl>
            )}
            />

            <Controller
            name="score"
            control={control}
            rules={{
                required: 'Score must be a number',
                pattern: {
                value: /^\d+$/,
                message: 'Please enter a valid number',
                },
            }}
            render={({ field }) => (
                <TextField
                {...field}
                label="Score"
                variant="outlined"
                fullWidth
                type="number"
                error={!!errors.score}
                helperText={errors.score ? errors.score.message : ''}
                className="rounded-lg"
                />
            )}
            />

            <Box>
            <Button
                type="button"
                variant="outlined"
                onClick={handleReset}
            >
                Reset
            </Button>
            {isSubmitting ? (
                <Button
                type="submit"
                variant="contained"
                disabled
                endIcon={<CircularProgress size={20} />}
                >
                Saving...
                </Button>
            ) : (
                <Button
                type="submit"
                variant="contained"
                >
                Save
                </Button>
            )}
            </Box>
        </form>
        </CardContent>
    </Card>
  );
}
