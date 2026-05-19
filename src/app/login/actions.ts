"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

type LoginActionState = {
  message: string;
  status: "idle" | "success" | "error";
};

export async function sendMagicLink(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = getFormString(formData, "email").toLowerCase();
  const callbackUrl = getSafeCallbackUrl(getFormString(formData, "callbackUrl"));

  if (!email || !email.includes("@")) {
    return {
      message: "Enter a valid work email address.",
      status: "error",
    };
  }

  try {
    await signIn("nodemailer", {
      email,
      redirect: false,
      redirectTo: callbackUrl,
    });

    return {
      message: "Check your email for a secure Paladin sign-in link.",
      status: "success",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          "We could not send a secure sign-in link. Please try again.",
        status: "error",
      };
    }

    throw error;
  }
}

function getFormString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeCallbackUrl(callbackUrl: string) {
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//")
  ) {
    return "/dashboard";
  }

  return callbackUrl;
}
