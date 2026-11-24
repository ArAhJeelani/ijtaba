import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../state/supabase";
import { exchangeAuthCallback, submitAuth, type AuthMode } from "../state/authProtocol";
import { useAuth } from "../state/Auth";
import { useCollection } from "../state/Collection";
import "./account.css";

const copy = {
  login: ["Welcome back to Ijabah", "Your du’as, wherever you are.", "Sign in"],
  signup: ["A space for your du’as", "Keep your supplications close, wherever life takes you.", "Create account"],
  forgot: ["Reset your password", "We’ll send a link to the email on your account.", "Send reset link"],
  password: ["Choose a new password", "Use at least 12 characters.", "Update password"],
};

function AccountLayout({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return <main className="account-page">
    <div className="account-landscape" aria-hidden="true" />
    <div className="account-content">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      {children}
    </div>
  </main>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [title, text, label] = copy[mode];
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if ((mode === "signup" || mode === "password") && password !== confirmation) {
      setError("The passwords must match.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await submitAuth(supabase.auth, mode, window.location.origin, email, password);
      if (result.path) navigate(result.path, { replace: true });
      setError(result.error ?? "");
      setStatus(result.status ?? "");
    } catch {
      setError("Could not connect to the account service. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return <AccountLayout title={title} text={text}>
    {!supabase ? <p>Account services are unavailable in this build.</p> :
      loading ? <p role="status">Checking your session…</p> :
      mode === "password" && !session ? <p><Link to="/forgot-password">Request a password reset link</Link></p> :
      session && (mode === "login" || mode === "signup") ? <Link to="/account">Open your account</Link> :
      <form onSubmit={submit} className="account-form">
        <fieldset disabled={busy}>
          {mode !== "password" && <label>Email<input name="email" type="email" autoComplete="email" required /></label>}
          {mode !== "forgot" && <>
            <label>Password<input name="password" type={show ? "text" : "password"} minLength={mode === "login" ? undefined : 12} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
            <button className="account-visibility" type="button" aria-pressed={show} onClick={() => setShow(!show)}>
              {show ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />} {show ? "Hide password" : "Show password"}
            </button>
          </>}
          {(mode === "signup" || mode === "password") && <label>Confirm password<input name="confirmation" type={show ? "text" : "password"} autoComplete="new-password" minLength={12} required /></label>}
          <button className="button" type="submit">{busy ? "Please wait…" : label}</button>
        </fieldset>
      </form>}
    {status && <p role="status">{status}</p>}
    {error && <p role="alert">{error}</p>}
    <nav className="account-links" aria-label="Account options">
      {mode !== "login" && <Link to="/login">Sign in</Link>}
      {mode === "login" && <><Link to="/forgot-password">Forgot password?</Link><Link to="/signup">Create an account</Link></>}
      <Link to="/discover">Browse du’as</Link>
    </nav>
  </AccountLayout>;
}

let activeCallback: { search: string; result: Promise<string> } | undefined;

export function AuthCallback() {
  const { search, state } = useLocation();
  const navigate = useNavigate();
  const failed = state?.failed === true;
  useEffect(() => {
    if (failed) return;
    if (activeCallback?.search !== search) activeCallback = { search, result: supabase ? exchangeAuthCallback(supabase.auth, search) : Promise.reject(new Error("Account services are unavailable.")) };
    const callback = activeCallback;
    let active = true;
    callback.result.then(path => {
      if (active) {
        activeCallback = undefined;
        navigate(path, { replace: true });
      }
    }, () => {
      if (active) {
        activeCallback = undefined;
        navigate("/auth/callback", { replace: true, state: { failed: true } });
      }
    });
    return () => { active = false; };
  }, [failed, search, navigate]);
  return <AccountLayout title="Opening your account">
    {failed ? <p role="alert">This link could not be verified. Open the newest email link, or <Link to="/login">return to sign in</Link>.</p>
      : <p role="status">Verifying your link…</p>}
  </AccountLayout>;
}

export function AccountPage() {
  const { session, loading } = useAuth();
  const { cloud } = useCollection();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const user = session?.user;

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    setError("");
    setStatus("");
    setBusy(true);
    try {
      const { error } = await supabase!.auth.updateUser({ data: { display_name: displayName || null } });
      if (error) throw error;
      setStatus("Display name saved.");
    } catch {
      setError("Could not save your display name.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (cloud?.state === "syncing") return;
    if (cloud?.hasPending && !window.confirm("Sign out with unsynced changes? Export your organizer from My Du’as first to keep a copy.")) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase!.auth.signOut({ scope: "local" });
      if (error) throw error;
      cloud?.discardRecovery();
      navigate("/login", { replace: true });
    } catch {
      setError("Sign-out could not finish. Try again before leaving this device.");
    } finally {
      setBusy(false);
    }
  }

  return <AccountLayout title="Your account">
    {loading ? <p role="status">Checking your session…</p> : !user ? <p><Link to="/login">Sign in</Link> to view your account.</p> : <>
      <p>{user.email}</p>
      <p>Member since {new Date(user.created_at).toLocaleDateString()}</p>
      <p>Your private organizer is stored by Supabase and is accessible from this account.</p>
      <form className="account-form" onSubmit={update}>
        <label>Display name (optional)<input name="name" maxLength={80} defaultValue={typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : ""} /></label>
        <button type="submit" className="button" disabled={busy}>Save display name</button>
      </form>
      <div className="account-links">
        <Link to="/account/password">Change password</Link>
        <Link to="/my-duas#organizer-backup-heading">Export organizer data</Link>
        <button type="button" className="button" onClick={signOut} disabled={busy || cloud?.state === "syncing"}>Sign out</button>
      </div>
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
    </>}
  </AccountLayout>;
}
