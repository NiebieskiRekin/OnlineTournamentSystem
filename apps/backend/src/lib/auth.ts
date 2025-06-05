
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/backend/db";
import { sendAccountConfirmationEmail, sendResetPasswordEmail } from "./mailer";
import logger from "./logger";
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {  
        enabled: true,
        requireEmailVerification: true,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({user, url, token}) => {
            logger.info('Password reset email '+token)
            await sendResetPasswordEmail(user.email, user.name, url);
        },
        resetPasswordTokenExpiresIn: 24*60*60,
    },
    trustedOrigins: [
        'http://localhost:5173', 'http://localhost:3000'
    ],
    emailVerification: {
        sendVerificationEmail: async ( { user, url, token }) => {
          logger.info('Send verification email '+token)
          await sendAccountConfirmationEmail(user.email, user.name, url);
        },
        expiresIn: 24*60*60,
        autoSignInAfterVerification: true,
        sendOnSignUp: true,
    },
});

export type auth_vars = {
    Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  }};