import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setUser } from "../features/userSlice";
import { login, signup } from "../api/auth.api";
import { getProfile } from "../api/profile.api";
import { API_BASE_URL, getErrorMessage } from "../lib/apiClient";
import { DemoAccounts } from "../components/DemoAccounts";

type Mode = "login" | "signup";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const existingUser = useAppSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingUser) {
      navigate("/feed", { replace: true });
    }
  }, [existingUser, navigate]);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const oauthError = searchParams.get("error");
    if (oauthError === "oauth_failed") {
      setError("Google sign-in failed. Please try again.");
      setSearchParams({}, { replace: true });
    } else if (oauth === "success") {
      getProfile()
        .then((user) => {
          dispatch(setUser(user));
          navigate("/feed", { replace: true });
        })
        .catch(() => setError("Signed in, but loading your profile failed."))
        .finally(() => setSearchParams({}, { replace: true }));
    }
  }, [searchParams, setSearchParams, dispatch, navigate]);

  const runLogin = async (email: string, secret: string) => {
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ emailId: email, password: secret });
      dispatch(setUser(user));
      navigate("/feed", { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError, "Authentication failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") {
      await runLogin(emailId, password);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const user = await signup({ firstName, lastName, emailId, password });
      dispatch(setUser(user));
      navigate("/profile", { replace: true });
    } catch (signupError) {
      setError(getErrorMessage(signupError, "Authentication failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSelect = (email: string, secret: string) => {
    setMode("login");
    setEmailId(email);
    setPassword(secret);
    void runLogin(email, secret);
  };

  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-8 py-4 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-2xl bg-indigo-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-2.5 text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-extrabold">
            DC
          </span>
          DevCollab
        </div>
        <div className="relative space-y-5">
          <h2 className="text-3xl font-extrabold leading-tight">
            Where developers meet, match, and build.
          </h2>
          <ul className="space-y-3 text-sm text-white/90">
            {[
              "Skill-ranked matches with other developers",
              "Real-time chat with your connections",
              "A shared editor for pair programming",
            ].map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/70">
          Trusted demo environment — sign in with one click.
        </p>
      </div>

      <div className="flex flex-col gap-6">
      <div className="surface animate-fade-up p-8">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          {mode === "login"
            ? "Sign in to continue to DevCollab"
            : "Join the developer network"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input input-bordered w-full"
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
              <input
                className="input input-bordered w-full"
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
          ) : null}
          <input
            type="email"
            className="input input-bordered w-full"
            placeholder="Email"
            value={emailId}
            onChange={(event) => setEmailId(event.target.value)}
            required
          />
          <input
            type="password"
            className="input input-bordered w-full"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error ? (
            <div className="alert alert-error py-2 text-sm">
              <span>{error}</span>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Sign up"}
          </button>
        </form>

        <div className="divider text-xs">OR</div>

        <a href={`${API_BASE_URL}/auth/google`} className="btn btn-outline w-full">
          Continue with Google
        </a>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-base-content/70 hover:text-primary"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setError("");
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Log in"}
        </button>
      </div>

        <DemoAccounts onSelect={handleDemoSelect} disabled={submitting} />
      </div>
    </div>
  );
};

export default Login;
