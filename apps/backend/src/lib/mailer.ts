import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";
import { generateEmailTemplate } from "./email-template";
import logger from "./logger";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  auth: {
    user: ProcessEnv.EMAIL_USER,
    pass: ProcessEnv.EMAIL_PASS
  },
});

export async function sendResetPasswordEmail(email: string, name: string, url: string) {
    const mailOptions = {
      from: ProcessEnv.EMAIL_USER,
      to: email,
      subject: "🔑 Password reset email for the online tournament system",
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      html: generateEmailTemplate(name,url).toString(),
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Sent password reset email to '+email)
    } catch (error) {
      logger.error(`Error ecountered when sending password reset email to ${email}:`, error)
    }
}