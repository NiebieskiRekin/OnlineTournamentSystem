import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";
import logger from "./logger";

const commonStyles = `<style>
  body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333333;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
  }
  .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
  }
  .email-header {
      text-align: center;
      margin-bottom: 30px;
  }
  .email-header h1 {
      color: #1a202c;
      font-size: 28px;
      margin: 0;
  }
  .email-content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
  }
  .button-container {
      text-align: center;
      margin: 30px 0;
  }
  .button {
      display: inline-block;
      padding: 14px 28px;
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      background-color: #007bff;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color 0.3s ease;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);
  }
  .button:hover {
      background-color: #0056b3;
  }
  .reset-link {
      word-break: break-all;
      font-size: 14px;
      color: #007bff;
      text-decoration: underline;
  }
  .email-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      font-size: 14px;
      color: #777777;
  }
  @media only screen and (max-width: 600px) {
      .email-container {
          padding: 20px;
          margin: 10px;
          border-radius: 0;
      }
      .email-header h1 {
          font-size: 24px;
      }
      .email-content p {
          font-size: 15px;
      }
      .button {
          padding: 12px 24px;
          font-size: 16px;
      }
      .email-footer {
          font-size: 13px;
      }
  }
</style>`

export function generatePasswordResetEmailTemplate(
    name: string, link: string, email: string
  ) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    ${commonStyles}
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="email-content">
            <p>Hi ${name},</p>
            <p>We received a request to reset the password for your account ${email}.</p>
            <p>To reset your password, please click on the button below or use the direct link provided. This link will expire in 24 hours for security reasons.</p>
            <div class="button-container">
                <a href="${link}" class="button">Reset Password</a>
            </div>
            <p>Alternatively, you can copy and paste the following link into your web browser:</p>
            <p><a href="${link}" class="reset-link">${link}</a></p>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>For your security, we recommend choosing a strong, unique password that you don't use for other accounts.</p>
        </div>
        <div class="email-footer">
            <p>Thanks</p>
        </div>
    </div>
</body>
</html>
    `;
  }

export function generateAccountConfirmationEmailTemplate(
    name: string, link: string, email: string
  ) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account confirmation</title>
    ${commonStyles}
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Account confirmation</h1>
        </div>
        <div class="email-content">
            <p>Hi ${name},</p>
            <p>Thanks for signing up to the Online Tournament System</p>
            <p>To complete the account creation process, please click on the button below or use the direct link provided. This link will expire in 24 hours for security reasons.</p>
            <div class="button-container">
                <a href="${link}" class="button">Confirm account ${email}</a>
            </div>
            <p>Alternatively, you can copy and paste the following link into your web browser:</p>
            <p><a href="${link}" class="reset-link">${link}</a></p>
            <p>If you did not sign up for our service, please ignore this email. This account will not be created.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

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
      html: generatePasswordResetEmailTemplate(name,url,email),
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Sent password reset email to '+email)
    } catch (error) {
      logger.error(`Error ecountered when sending password reset email to ${email}:`, error)
    }
}

export async function sendAccountConfirmationEmail(email: string, name: string, url: string) {
  const mailOptions = {
    from: ProcessEnv.EMAIL_USER,
    to: email,
    subject: "👋 Thanks for signing up to the online tournament system",
    html: generateAccountConfirmationEmailTemplate(name,url,email),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Sent account confirmation email to '+email)
  } catch (error) {
    logger.error(`Error ecountered when sending account confirmation email to ${email}:`, error)
  }
}