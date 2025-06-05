/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import { authClient } from '~/lib/auth';
import { useForm, type SubmitHandler } from 'react-hook-form';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

type Inputs = {
  email: string
};

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {

  const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Inputs>()
    const onSubmit: SubmitHandler<Inputs> = async (data) => {
      await authClient.forgetPassword({
          email: data.email,
          redirectTo: "http://localhost:5173/reset-password",
        },
        {
          onError: (ctx) => {
            alert(ctx.error.message);
          },
        }
      );
    }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit(onSubmit),
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to
          reset your password.
        </DialogContentText>
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
          {...register("email", { required: true })}
        />
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" type="submit">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}