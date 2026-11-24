import assert from "node:assert/strict";
import test from "node:test";
import { AuthError, createClient } from "@supabase/supabase-js";
import { exchangeAuthCallback, submitAuth } from "./authProtocol.ts";

const origin = "https://ijabah.example";
const email = "test@example.net";
const password = "fixture-only-password";
const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const claims = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: "fixture" })).toString("base64url");
const user = { id: "fixture", email, aud: "authenticated", user_metadata: {}, app_metadata: {}, created_at: "2026-11-24T00:00:00Z" };
const session = { access_token: header + "." + claims + ".fixture", refresh_token: "fixture", token_type: "bearer", expires_in: 3600, user };

test("email signup, login, session restoration and local logout with the Supabase SDK", async () => {
  const storage = new Map<string, string>();
  const requests: string[] = [];
  const client = () => createClient("https://project.supabase.co", "sb_publishable_fixture", {
    auth: {
      storage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); }, removeItem: (key) => { storage.delete(key); } },
      autoRefreshToken: false, flowType: "pkce", detectSessionInUrl: false,
    },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push(url.pathname);
      if (url.pathname.endsWith("/signup")) {
        assert.equal(url.searchParams.get("redirect_to"), origin + "/auth/callback");
        return Response.json(user);
      }
      if (url.pathname.endsWith("/token")) {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.email, email);
        if (body.password !== password) return Response.json({ code: "invalid_credentials", message: "invalid" }, { status: 400 });
        return Response.json(session);
      }
      if (url.pathname.endsWith("/logout")) {
        assert.equal(url.searchParams.get("scope"), "local");
        return new Response(null, { status: 204 });
      }
      throw new Error("Unexpected fixture request");
    } },
  });
  const first = client();
  assert.match((await submitAuth(first.auth, "signup", origin, email, password)).status ?? "", /confirmation/);
  assert.match((await submitAuth(first.auth, "login", origin, email, "wrong")).error ?? "", /Sign-in failed/);
  assert.deepEqual(await submitAuth(first.auth, "login", origin, email, password), { path: "/account" });
  const restored = client();
  assert.equal((await restored.auth.getSession()).data.session?.user.email, email);
  assert.equal((await restored.auth.signOut({ scope: "local" })).error, null);
  assert.equal((await restored.auth.getSession()).data.session, null);
  assert.deepEqual(requests, ["/auth/v1/signup", "/auth/v1/token", "/auth/v1/token", "/auth/v1/logout"]);
});

test("password reset requests and callbacks only accept expected email link flows", async () => {
  const auth = {
    resetPasswordForEmail: async (_email: string, options?: { redirectTo?: string }) => {
      assert.equal(options?.redirectTo, origin + "/auth/callback?flow=recovery");
      return { data: {}, error: null };
    },
    verifyOtp: async () => ({ data: { user: null, session: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: new AuthError("expired") }),
    updateUser: async () => ({ data: { user: null }, error: new AuthError("expired") }),
  } as unknown as Parameters<typeof submitAuth>[0];
  assert.match((await submitAuth(auth, "forgot", origin, email, "")).status ?? "", /reset link/);
  assert.equal(await exchangeAuthCallback(auth, "?type=recovery&token_hash=fixture"), "/account/password");
  assert.equal(await exchangeAuthCallback(auth, "?type=email&token_hash=fixture"), "/account");
  await assert.rejects(() => exchangeAuthCallback(auth, "?type=invite&token_hash=fixture"));
  await assert.rejects(() => exchangeAuthCallback(auth, "?code=expired"));
  assert.match((await submitAuth(auth, "password", origin, "", password)).error ?? "", /could not be updated/);
});
