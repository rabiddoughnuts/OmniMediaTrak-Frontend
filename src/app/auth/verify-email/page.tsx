"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserApiUrl } from "../../../lib/api-url";

type VerificationState = "verifying" | "verified" | "error";

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const started = useRef(false);
  const [state, setState] = useState<VerificationState>(token ? "verifying" : "error");
  const [message, setMessage] = useState(
    token ? "Verifying your email address..." : "This verification link is missing its token."
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) return;

    async function verify() {
      try {
        const response = await fetch(browserApiUrl("/auth/email/verification/confirm"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await response.json()) as { error?: string | { message?: string } };
        if (!response.ok) {
          const error = typeof data.error === "string" ? data.error : data.error?.message;
          throw new Error(error ?? "Email verification failed");
        }
        setState("verified");
        setMessage("Your email address is verified.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Email verification failed");
      }
    }
    void verify();
  }, [token]);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Account security</p>
          <h1 className="page__title">Verify email</h1>
          <p className="page__subtitle" aria-live="polite">{message}</p>
        </div>
      </header>
      <section className="form-card">
        {state === "verifying" && <p className="helper">Please keep this page open.</p>}
        {state === "verified" && <Link className="button button--primary" href="/account">Return to account</Link>}
        {state === "error" && (
          <p className="helper">Open Account settings to request a fresh verification email. <Link href="/account">Account settings</Link></p>
        )}
      </section>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
