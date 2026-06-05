"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createDashboardAuthToken,
  DASHBOARD_AUTH_COOKIE,
} from "../_lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    return { error: "Dashboard access is not configured." };
  }

  if (typeof password !== "string" || password !== expected) {
    return { error: "Invalid password." };
  }

  const token = await createDashboardAuthToken(expected);
  const cookieStore = await cookies();

  cookieStore.set(DASHBOARD_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const from = formData.get("from");
  if (typeof from === "string" && from.startsWith("/dashboard") && from !== "/dashboard/login") {
    redirect(from);
  }

  redirect("/dashboard");
}
