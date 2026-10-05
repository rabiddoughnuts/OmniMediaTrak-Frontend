"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserApiUrl } from "../../../lib/api-url";
import { notifyAuthChanged, safeAuthRedirectPath } from "../../../lib/auth-state";

type FormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  metroArea: string;
  regionCode: string;
  countryCode: string;
  race: string;
  gender: string;
  birthDate: string;
  trendAnalyticsOptIn: boolean;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

function RegisterPageContent() {
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    metroArea: "",
    regionCode: "",
    countryCode: "",
    race: "",
    gender: "",
    birthDate: "",
    trendAnalyticsOptIn: false,
  });
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          browserApiUrl(`/auth/username-available?username=${encodeURIComponent(username)}`),
          { credentials: "include" }
        );
        const data = (await response.json()) as { available?: boolean };
        setUsernameState(response.ok && data.available ? "available" : "taken");
      } catch {
        setUsernameState("idle");
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form.username]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback(null);

    if (form.password !== form.confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match" });
      setStatus("idle");
      return;
    }
    if (usernameState === "taken") {
      setFeedback({ type: "error", message: "Username is unavailable" });
      setStatus("idle");
      return;
    }

    try {
      const response = await fetch(browserApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          metroArea: form.metroArea || null,
          regionCode: form.regionCode || null,
          countryCode: form.countryCode || null,
          race: form.race || null,
          gender: form.gender || null,
          birthDate: form.birthDate || null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string | { message?: string } };
        const message = typeof data.error === "string" ? data.error : data.error?.message;
        throw new Error(message ?? "Registration failed");
      }

      const nextPath = safeAuthRedirectPath(searchParams.get("next"));
      setFeedback({ type: "success", message: "Account created. Welcome in!" });
      setForm({
        username: "", email: "", password: "", confirmPassword: "",
        metroArea: "", regionCode: "", countryCode: "", race: "",
        gender: "", birthDate: "", trendAnalyticsOptIn: false,
      });
      notifyAuthChanged("login");
      window.location.assign(nextPath);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Registration failed",
      });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="page page--scroll">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Private alpha</p>
          <h1 className="page__title">Create your account</h1>
          <p className="page__subtitle">
            Start tracking across books, anime, games, podcasts, and more.
          </p>
        </div>
      </header>

      <section className="form-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Username</span>
            <input
              className="input"
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]+"
              autoComplete="username"
              value={form.username}
              onChange={(event) => {
                const username = event.target.value.toLowerCase();
                setUsernameState(/^[a-z0-9_]{3,30}$/.test(username) ? "checking" : "idle");
                setForm((prev) => ({ ...prev, username }));
              }}
              placeholder="letters_numbers"
            />
            {usernameState !== "idle" && (
              <small className={usernameState === "available" ? "helper success" : usernameState === "taken" ? "helper error" : "helper"}>
                {usernameState === "checking" ? "Checking..." : usernameState === "available" ? "Username available" : "Username unavailable"}
              </small>
            )}
            <small className="muted">Your stable sharing handle and initial display name. You can change the display name later.</small>
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="you@example.com"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="At least 8 characters"
            />
          </label>

          <label className="form-field">
            <span>Confirm password</span>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
            />
          </label>

          <div className="settings-section form-field--wide">
            <h2>Optional marketing and trend data</h2>
            <p className="helper">This section is optional and off by default. You can provide or edit these fields without opting in; they are included in aggregate processing only while you are opted in.</p>
            <label className="consent-row">
              <input type="checkbox" checked={form.trendAnalyticsOptIn} onChange={(event) => setForm((prev) => ({ ...prev, trendAnalyticsOptIn: event.target.checked }))} />
              <span>Use these optional profile details and my explicit ratings for thresholded aggregate trends, product suggestions, and non-user-identifying marketing insights.</span>
            </label>
            <div className="form-grid">
              <label className="form-field"><span>Metro area</span><input className="input" required={form.trendAnalyticsOptIn} maxLength={100} placeholder="Dayton" value={form.metroArea} onChange={(event) => setForm((prev) => ({ ...prev, metroArea: event.target.value }))} /></label>
              <label className="form-field"><span>State or region</span><input className="input" maxLength={32} placeholder="OH" value={form.regionCode} onChange={(event) => setForm((prev) => ({ ...prev, regionCode: event.target.value.toUpperCase() }))} /></label>
              <label className="form-field"><span>Country code</span><input className="input" required={form.trendAnalyticsOptIn} maxLength={2} pattern="[A-Za-z]{2}" placeholder="US" value={form.countryCode} onChange={(event) => setForm((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))} /></label>
              <label className="form-field"><span>Race or ethnicity</span><input className="input" maxLength={100} placeholder="Self-described (optional)" value={form.race} onChange={(event) => setForm((prev) => ({ ...prev, race: event.target.value }))} /></label>
              <label className="form-field"><span>Gender</span><input className="input" maxLength={100} placeholder="Self-described (optional)" value={form.gender} onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))} /></label>
              <label className="form-field"><span>Birthday</span><input className="input" type="date" min="1900-01-01" max={new Date().toISOString().slice(0, 10)} value={form.birthDate} onChange={(event) => setForm((prev) => ({ ...prev, birthDate: event.target.value }))} /></label>
            </div>
            <button className="button button--ghost" type="button" onClick={() => setForm((prev) => ({ ...prev, metroArea: "", regionCode: "", countryCode: "", race: "", gender: "", birthDate: "", trendAnalyticsOptIn: false }))}>Clear optional data</button>
            <p className="helper">Only coarse self-declared location, optional demographic details, birthday-derived age bands, and ratings are used. Results below privacy thresholds are suppressed. <a href="/privacy">Privacy details</a></p>
          </div>

          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={status === "loading" || usernameState === "checking" || usernameState === "taken"}>
              {status === "loading" ? "Creating..." : "Create account"}
            </button>
            <button className="button button--ghost" type="button" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>

        {feedback && (
          <p className={feedback.type === "success" ? "helper success" : "helper error"}>
            {feedback.message}
          </p>
        )}

        <p className="helper">
          Already have an account?{" "}
          <a href={`/auth/login?next=${encodeURIComponent(safeAuthRedirectPath(searchParams.get("next")))}`}>
            Sign in
          </a>
        </p>
      </section>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
