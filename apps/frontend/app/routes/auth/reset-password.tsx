/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {Card} from '~/components/ui/card';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoginContainer } from '~/components/ui/login-container';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { authClient } from '~/lib/auth';
import { useSnackbar } from 'notistack';


type Inputs = {
  password: string
}


export default function ResetPassword() {
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const { enqueueSnackbar } = useSnackbar();

  const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Inputs>()
    const onSubmit: SubmitHandler<Inputs> = async (data) => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        enqueueSnackbar('Token not found', { variant: 'error' });
        console.error('Token not found')
        return;
      }
      if (!data.password || data.password.length < 6) {
        setPasswordError(true);
        setPasswordErrorMessage('Password must be at least 6 characters long.');
        return;
      } else {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }
      const resp = await authClient.resetPassword({newPassword: data.password, token})

      if (resp.error){
        enqueueSnackbar(resp.error.message, { variant: 'error' })
      } else {
        enqueueSnackbar("Password changed", { variant: 'success' })
      }
    }


  return (
    <div>
      <CssBaseline enableColorScheme />
      <LoginContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            New password
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                {...register("password", { required: true })}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
            >
              Reset password
            </Button>
          </Box>
        </Card>
      </LoginContainer>
    </div>
  );
}