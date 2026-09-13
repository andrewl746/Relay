"use server"

import { cookies } from "next/headers";
import { USER_COOKIE } from "./dev-login";

export async function loginAction(userId: string, email: string) {
  // No university email restriction — any email works.
  // University is selected during onboarding.
  if (!email || !email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }
  
  (await cookies()).set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax"
  });
}
