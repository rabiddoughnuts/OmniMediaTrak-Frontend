"use client";

import { useState } from "react";
import { browserApiUrl } from "../../lib/api-url";

export default function ContactPage() {
  const [purpose, setPurpose] = useState("other");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const response = await fetch(browserApiUrl("/support/contact"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose, email: email || null, subject, message }),
    });
    if (response.ok) {
      setSubject("");
      setMessage("");
      setFeedback("Request received");
    } else {
      setFeedback("Unable to submit request");
    }
    setPending(false);
  }

  return (
    <section className="page">
      <header className="page__header"><div><h1 className="page__title">Contact</h1></div></header>
      <form className="form form-card" onSubmit={submit}>
        <label className="form-field"><span>Purpose</span><select className="input" value={purpose} onChange={(event) => setPurpose(event.target.value)}><option value="bug">Bug</option><option value="missing_media">Missing media</option><option value="incorrect_media">Incorrect media</option><option value="privacy">Privacy</option><option value="layout_feedback">Layout feedback</option><option value="other">Other</option></select></label>
        <label className="form-field"><span>Contact email</span><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className="form-field"><span>Subject</span><input className="input" required maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
        <label className="form-field"><span>Message</span><textarea className="input" required maxLength={5000} rows={8} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? "Submitting..." : "Submit"}</button>
        {feedback && <p className="helper">{feedback}</p>}
      </form>
    </section>
  );
}
