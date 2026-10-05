"use client";

import { useEffect, useState } from "react";
import { browserApiUrl } from "../../lib/api-url";

type FilterLayout = "overview" | "categories";

const LAYOUT_STORAGE_KEY = "omnimediatrak-filter-layout";

export default function FeedbackPage() {
  const [layout, setLayout] = useState<FilterLayout>("overview");
  const [area, setArea] = useState("Media filters");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    const frame = window.requestAnimationFrame(() => {
      if (stored === "overview" || stored === "categories") setLayout(stored);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmissionStatus(null);
    try {
      const response = await fetch(browserApiUrl("/support/contact"), {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          purpose: "layout_feedback",
          email: email || null,
          subject: `${area} - ${layout} filter layout`,
          message,
        }),
      });
      if (!response.ok) throw new Error("request failed");
      setMessage("");
      setSubmissionStatus("Feedback received");
    } catch {
      setSubmissionStatus("Unable to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page feedback-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Layout Feedback</h1>
          <p className="page__subtitle">Tell us which alpha layout works better and where the interface gets in your way.</p>
        </div>
      </header>

      <form className="form form-card feedback-form" onSubmit={submitFeedback}>
        <label className="form-field">
          <span>Area</span>
          <select className="input" value={area} onChange={(event) => setArea(event.target.value)}>
            <option>Media filters</option>
            <option>Media group sidebar</option>
            <option>Media list</option>
            <option>My lists</option>
            <option>Media details</option>
            <option>Navigation</option>
            <option>Other</option>
          </select>
        </label>
        <fieldset className="feedback-layout-choice">
          <legend>Filter layout used</legend>
          <div className="segmented-control">
            <button type="button" className={layout === "overview" ? "active" : ""} aria-pressed={layout === "overview"} onClick={() => setLayout("overview")}>Overview</button>
            <button type="button" className={layout === "categories" ? "active" : ""} aria-pressed={layout === "categories"} onClick={() => setLayout("categories")}>Categories</button>
          </div>
        </fieldset>
        <label className="form-field">
          <span>Contact email (optional)</span>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Feedback</span>
          <textarea className="input" required maxLength={5000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit feedback"}</button>
        {submissionStatus && <p className="helper" role="status">{submissionStatus}</p>}
      </form>

    </section>
  );
}
