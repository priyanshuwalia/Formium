import { Resend } from "resend";

let resend: Resend | null = null;

const getResend = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const isConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  if (!isConfigured()) return;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${base}/verify-email?token=${token}`;
  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "Formium <no-reply@formium.app>",
    to,
    subject: "Verify your Formium email",
    html: `<h1>Welcome to Formium</h1><p>Click the link below to verify your email address:</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  if (!isConfigured()) return;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;
  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "Formium <no-reply@formium.app>",
    to,
    subject: "Reset your Formium password",
    html: `<h1>Reset your password</h1><p>Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p>`,
  });
}

export async function sendNewResponseNotification(
  to: string,
  formTitle: string,
  formSlug: string,
  responseCount: number,
) {
  if (!isConfigured()) return;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "Formium <no-reply@formium.app>",
    to,
    subject: `New response to "${formTitle}"`,
    html: `<h1>You got a new response</h1><p>Your form "${formTitle}" received a new submission. You now have ${responseCount} total responses.</p><p><a href="${base}/forms/${formSlug}/responses">View responses</a></p>`,
  });
}