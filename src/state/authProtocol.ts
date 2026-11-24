import type { SupabaseClient } from "@supabase/supabase-js";

type Auth = Pick<SupabaseClient["auth"],
  "signUp" | "signInWithPassword" | "resetPasswordForEmail" | "updateUser" |
  "verifyOtp" | "exchangeCodeForSession">;

export type AuthMode = "login" | "signup" | "forgot" | "password";

export async function submitAuth(auth: Auth, mode: AuthMode, origin: string, email: string, password: string) {
  const callback = new URL("/auth/callback", origin);
  if (mode === "login") {
    const result = await auth.signInWithPassword({ email, password });
    if (!result.error) return { path: "/account" };
    return { error: result.error.code === "email_not_confirmed"
      ? "Confirm your email before signing in."
      : "Sign-in failed. Check your email and password and try again." };
  }
  if (mode === "signup") {
    const result = await auth.signUp({ email, password, options: { emailRedirectTo: callback.href } });
    if (result.error) return { error: "Account creation failed. Check your email and choose a stronger password, or try again later." };
    return result.data.session
      ? { path: "/account" }
      : { status: "Check your inbox for a confirmation link. You can sign in after confirming your email." };
  }
  if (mode === "forgot") {
    callback.searchParams.set("flow", "recovery");
    const result = await auth.resetPasswordForEmail(email, { redirectTo: callback.href });
    if (result.error && result.error.status !== 404) return { error: "The request could not be completed. Try again in a few minutes." };
    return { status: "If this email has an account, a reset link will arrive shortly." };
  }
  const result = await auth.updateUser({ password });
  return result.error
    ? { error: "Password could not be updated. Open a fresh reset link and try again." }
    : { path: "/account" };
}

export async function exchangeAuthCallback(auth: Auth, search: string) {
  const params = new URLSearchParams(search);
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (params.has("error") || params.has("error_code")) throw new Error("Invalid account link.");
  if (tokenHash && (type === "email" || type === "recovery")) {
    const result = await auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error) throw new Error("Invalid account link.");
    return type === "recovery" ? "/account/password" : "/account";
  }
  if (!code) throw new Error("Invalid account link.");
  const result = await auth.exchangeCodeForSession(code);
  if (result.error) throw new Error("Invalid account link.");
  return params.get("flow") === "recovery" ? "/account/password" : "/account";
}
