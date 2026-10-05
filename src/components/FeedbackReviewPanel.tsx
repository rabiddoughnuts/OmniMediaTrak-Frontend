"use client";

import { useState } from "react";
import { browserApiUrl } from "../lib/api-url";

type FilterLayout = "overview" | "categories";
type FeedbackItem = {
  id: string;
  username: string | null;
  contact_email: string | null;
  subject: string;
  message: string;
  status: "open" | "closed";
  created_at: string;
};
type ReviewData = {
  preferences: Array<{ variant: FilterLayout; users: number }>;
  feedback: FeedbackItem[];
};

export default function FeedbackReviewPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [review, setReview] = useState<ReviewData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadReview() {
    setStatusMessage(null);
    try {
      const response = await fetch(browserApiUrl("/support/layout-feedback"), {
        credentials: "include",
        headers: { "x-admin-token": adminToken },
      });
      if (!response.ok) throw new Error("request failed");
      setReview(await response.json() as ReviewData);
    } catch {
      setReview(null);
      setStatusMessage("Unable to load feedback. Check the admin token.");
    }
  }

  async function updateStatus(id: string, status: "open" | "closed") {
    try {
      const response = await fetch(browserApiUrl(`/support/layout-feedback/${id}`), {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("request failed");
      setReview((current) => current ? {
        ...current,
        feedback: current.feedback.map((item) => item.id === id ? { ...item, status } : item),
      } : current);
    } catch {
      setStatusMessage("Unable to update feedback status");
    }
  }

  const preferenceCounts = Object.fromEntries(
    (review?.preferences ?? []).map((item) => [item.variant, Number(item.users)])
  ) as Partial<Record<FilterLayout, number>>;

  return (
    <div className="feedback-review">
      <div className="feedback-review__controls">
        <label className="form-field">
          <span>Admin token</span>
          <input className="input" type="password" autoComplete="off" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} />
        </label>
        <button className="button" type="button" onClick={loadReview} disabled={!adminToken}>Load feedback</button>
      </div>
      {statusMessage && <p className="helper" role="status">{statusMessage}</p>}
      {review && (
        <>
          <div className="feedback-preference-counts" aria-label="Signed-in filter layout preferences">
            <div><strong>{preferenceCounts.overview ?? 0}</strong><span>Overview</span></div>
            <div><strong>{preferenceCounts.categories ?? 0}</strong><span>Categories</span></div>
          </div>
          <div className="feedback-review__list">
            {review.feedback.map((item) => (
              <article key={item.id} className="feedback-entry">
                <header>
                  <div><strong>{item.subject}</strong><span>{item.username ?? item.contact_email ?? "Anonymous"}</span></div>
                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                </header>
                <p>{item.message}</p>
                <button type="button" onClick={() => updateStatus(item.id, item.status === "open" ? "closed" : "open")}>
                  {item.status === "open" ? "Mark closed" : "Reopen"}
                </button>
              </article>
            ))}
            {review.feedback.length === 0 && <p className="muted">No layout feedback submitted yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
