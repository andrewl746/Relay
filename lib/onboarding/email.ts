import { Resend } from "resend";
import { CODE_TTL_MINUTES } from "./otp";
import { SITE_NAME } from "@/lib/hub/site";

export async function sendVerificationEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to,
    subject: `Your ${SITE_NAME} verification code`,
    html: `
      <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; margin-bottom: 8px;">Thanks for joining ${SITE_NAME}</h1>
        <p style="color: #57534a; margin-bottom: 24px;">
          Enter this code to verify your university email and finish setting up your account.
        </p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.1em; margin: 0 0 8px;">${code}</p>
        <p style="color: #8a8478; font-size: 13px;">This code expires in ${CODE_TTL_MINUTES} minutes.</p>
      </div>
    `,
    text: `Thanks for joining ${SITE_NAME}. Your verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
  });

  if (error) throw new Error(error.message);
}
