"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApiUrl } from "../../lib/api-url";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  email_verified_at: string | null;
  bio: string | null;
  metro_area: string | null;
  region_code: string | null;
  country_code: string | null;
  race: string | null;
  gender: string | null;
  birth_date: string | null;
  trend_analytics_opt_in: boolean;
  tracked_count: number;
  owned_list_count: number;
  shared_list_count: number;
  status_counts: Record<string, number>;
};

type FormState = {
  displayName: string;
  bio: string;
  metroArea: string;
  regionCode: string;
  countryCode: string;
  race: string;
  gender: string;
  birthDate: string;
  trendAnalyticsOptIn: boolean;
};

const EMPTY_FORM: FormState = {
  displayName: "",
  bio: "",
  metroArea: "",
  regionCode: "",
  countryCode: "",
  race: "",
  gender: "",
  birthDate: "",
  trendAnalyticsOptIn: false,
};

function profileForm(profile: Profile): FormState {
  return {
    displayName: profile.display_name,
    bio: profile.bio ?? "",
    metroArea: profile.metro_area ?? "",
    regionCode: profile.region_code ?? "",
    countryCode: profile.country_code ?? "",
    race: profile.race ?? "",
    gender: profile.gender ?? "",
    birthDate: profile.birth_date ?? "",
    trendAnalyticsOptIn: profile.trend_analytics_opt_in,
  };
}

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object" || !("error" in data)) return fallback;
  const error = (data as { error?: string | { message?: string } }).error;
  return typeof error === "string" ? error : error?.message ?? fallback;
}

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "error">("loading");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [activeSessionCount, setActiveSessionCount] = useState<number | null>(null);
  const [securityStatus, setSecurityStatus] = useState<"idle" | "working">("idle");
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(browserApiUrl("/profile"), { credentials: "include" });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const data = (await response.json()) as { profile: Profile };
      setProfile(data.profile);
      setForm(profileForm(data.profile));
      try {
        const sessionResponse = await fetch(browserApiUrl("/auth/sessions"), { credentials: "include" });
        if (sessionResponse.ok) {
          const sessionData = (await sessionResponse.json()) as { activeSessionCount: number };
          setActiveSessionCount(sessionData.activeSessionCount);
        }
      } catch {
        setActiveSessionCount(null);
      }
      setStatus("idle");
    }
    void load();
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setFeedback(null);
    const response = await fetch(browserApiUrl("/profile"), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        bio: form.bio || null,
        metroArea: form.metroArea || null,
        regionCode: form.regionCode || null,
        countryCode: form.countryCode || null,
        race: form.race || null,
        gender: form.gender || null,
        birthDate: form.birthDate || null,
      }),
    });
    const data = (await response.json()) as { profile?: Profile; error?: unknown };
    if (!response.ok || !data.profile) {
      setFeedback(errorMessage(data, "Profile update failed"));
      setStatus("idle");
      return;
    }
    setProfile(data.profile);
    setForm(profileForm(data.profile));
    setFeedback("Profile updated");
    setStatus("idle");
    window.dispatchEvent(new Event("omnimediatrak:auth"));
  }

  async function downloadExport() {
    const response = await fetch(browserApiUrl("/profile/export"), { credentials: "include" });
    if (!response.ok) {
      setFeedback("Export failed");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "omnimediatrak-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function clearOptionalData() {
    if (!window.confirm("Clear all optional marketing and trend data from your account? This also opts you out.")) {
      return;
    }
    setStatus("saving");
    setFeedback(null);
    const response = await fetch(browserApiUrl("/profile"), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metroArea: null,
        regionCode: null,
        countryCode: null,
        race: null,
        gender: null,
        birthDate: null,
        trendAnalyticsOptIn: false,
      }),
    });
    const data = (await response.json()) as { profile?: Profile; error?: unknown };
    if (!response.ok || !data.profile) {
      setFeedback(errorMessage(data, "Optional data could not be cleared"));
      setStatus("idle");
      return;
    }
    setProfile(data.profile);
    setForm((current) => ({
      ...current,
      metroArea: "",
      regionCode: "",
      countryCode: "",
      race: "",
      gender: "",
      birthDate: "",
      trendAnalyticsOptIn: false,
    }));
    setFeedback("Optional marketing and trend data cleared");
    setStatus("idle");
  }

  async function removeAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(browserApiUrl("/profile"), {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(errorMessage(data, "Account deletion failed"));
      return;
    }
    window.dispatchEvent(new Event("omnimediatrak:auth"));
    window.location.assign("/");
  }

  async function requestVerificationEmail() {
    setSecurityStatus("working");
    setSecurityFeedback(null);
    try {
      const response = await fetch(browserApiUrl("/auth/email/verification/request"), {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, "Verification email could not be sent"));
      setSecurityFeedback(
        (data as { alreadyVerified?: boolean }).alreadyVerified
          ? "This email address is already verified."
          : "Verification email sent. The link expires in 24 hours."
      );
    } catch (error) {
      setSecurityFeedback(error instanceof Error ? error.message : "Verification email could not be sent");
    } finally {
      setSecurityStatus("idle");
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityFeedback(null);
    if (newPassword !== confirmPassword) {
      setSecurityFeedback("New passwords do not match.");
      return;
    }
    setSecurityStatus("working");
    try {
      const response = await fetch(browserApiUrl("/auth/password/change"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, "Password could not be changed"));
      const revoked = (data as { revokedSessionCount?: number }).revokedSessionCount ?? 0;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveSessionCount(1);
      setSecurityFeedback(`Password changed. ${revoked} other ${revoked === 1 ? "session was" : "sessions were"} signed out.`);
    } catch (error) {
      setSecurityFeedback(error instanceof Error ? error.message : "Password could not be changed");
    } finally {
      setSecurityStatus("idle");
    }
  }

  async function signOutOtherSessions() {
    if (!window.confirm("Sign out every other browser and device currently using this account?")) return;
    setSecurityStatus("working");
    setSecurityFeedback(null);
    try {
      const response = await fetch(browserApiUrl("/auth/sessions/revoke-others"), {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(errorMessage(data, "Other sessions could not be revoked"));
      const revoked = (data as { revokedSessionCount?: number }).revokedSessionCount ?? 0;
      setActiveSessionCount(1);
      setSecurityFeedback(`${revoked} other ${revoked === 1 ? "session was" : "sessions were"} signed out.`);
    } catch (error) {
      setSecurityFeedback(error instanceof Error ? error.message : "Other sessions could not be revoked");
    } finally {
      setSecurityStatus("idle");
    }
  }

  if (status === "loading") return <section className="page"><p className="helper">Loading profile...</p></section>;
  if (status === "error" || !profile) {
    return <section className="page"><p className="helper error">Sign in to manage your profile.</p></section>;
  }

  return (
    <section className="page account-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Account</h1>
          <p className="page__subtitle">@{profile.username}</p>
        </div>
      </header>

      <dl className="stat-strip">
        <div><dt>Tracked</dt><dd>{profile.tracked_count}</dd></div>
        <div><dt>Your lists</dt><dd>{profile.owned_list_count}</dd></div>
        <div><dt>Shared with you</dt><dd>{profile.shared_list_count}</dd></div>
        <div><dt>Completed</dt><dd>{profile.status_counts.completed ?? 0}</dd></div>
      </dl>

      <form className="form settings-form" onSubmit={saveProfile}>
        <div className="settings-section">
          <h2>Profile</h2>
          <div className="form-grid">
            <label className="form-field"><span>Username</span><input className="input" readOnly value={profile.username} /><small className="muted">Stable handle used for sharing.</small></label>
            <label className="form-field"><span>Display name</span><input className="input" required maxLength={80} value={form.displayName} onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))} /></label>
            <label className="form-field form-field--wide"><span>Bio</span><textarea className="input" maxLength={500} rows={4} value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} /></label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Optional marketing and trend data</h2>
          <p className="helper">This section is optional. You can edit or retain these fields while opted out; they are included in aggregate processing only while you are opted in.</p>
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
          <button className="button button--ghost" type="button" disabled={status === "saving"} onClick={() => void clearOptionalData()}>Clear optional data</button>
          <p className="helper">Only coarse self-declared location, optional demographic details, birthday-derived age bands, and ratings are used. Results below privacy thresholds are suppressed. <Link href="/privacy">Privacy details</Link></p>
        </div>

        <div className="form-actions">
          <button className="button button--primary" type="submit" disabled={status === "saving"}>{status === "saving" ? "Saving..." : "Save profile"}</button>
          <button className="button button--ghost" type="button" onClick={downloadExport}>Download my data</button>
        </div>
        {feedback && <p className="helper">{feedback}</p>}
      </form>

      <section className="settings-section security-settings">
        <h2>Security</h2>
        <div className="security-summary">
          <div>
            <strong>Email address</strong>
            <span>{profile.email}</span>
          </div>
          <span className={profile.email_verified_at ? "status-pill status-pill--success" : "status-pill"}>
            {profile.email_verified_at ? "Verified" : "Not verified"}
          </span>
          {!profile.email_verified_at && (
            <button className="button button--ghost" type="button" disabled={securityStatus === "working"} onClick={() => void requestVerificationEmail()}>
              Send verification email
            </button>
          )}
        </div>

        <form className="form security-form" onSubmit={updatePassword}>
          <h3>Change password</h3>
          <p className="helper">Changing your password keeps this session open and signs out every other browser or device.</p>
          <div className="form-grid">
            <label className="form-field"><span>Current password</span><input className="input" type="password" autoComplete="current-password" required minLength={8} maxLength={256} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label className="form-field"><span>New password</span><input className="input" type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <label className="form-field"><span>Confirm new password</span><input className="input" type="password" autoComplete="new-password" required minLength={8} maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          </div>
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={securityStatus === "working"}>Change password</button>
          </div>
        </form>

        <div className="security-sessions">
          <div>
            <h3>Active sign-ins</h3>
            <p className="helper">{activeSessionCount === null ? "Session count unavailable." : `${activeSessionCount} active ${activeSessionCount === 1 ? "session" : "sessions"}, including this one.`}</p>
          </div>
          <button className="button button--ghost" type="button" disabled={securityStatus === "working" || activeSessionCount === 1} onClick={() => void signOutOtherSessions()}>
            Sign out other sessions
          </button>
        </div>
        {securityFeedback && <p className="helper" aria-live="polite">{securityFeedback}</p>}
      </section>

      <form className="settings-section danger-zone" onSubmit={removeAccount}>
        <h2>Delete account</h2>
        <div className="form-grid">
          <label className="form-field"><span>Password</span><input className="input" type="password" required minLength={8} value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /></label>
          <label className="form-field"><span>Type DELETE</span><input className="input" required value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label>
        </div>
        <button className="button button--danger" type="submit">Delete account</button>
      </form>
    </section>
  );
}
