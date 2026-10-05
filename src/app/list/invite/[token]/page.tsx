"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserApiUrl } from "../../../../lib/api-url";

type LinkPreview = {
  name: string;
  description: string | null;
  kind: "tracking" | "static" | "dynamic";
  owner_username: string;
  owner_display_name: string;
  expires_at: string;
  is_owner: boolean;
};

export default function ListInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch(browserApiUrl(`/lists/share-links/${token}`), {
        credentials: "include",
      });
      if (!response.ok) {
        setStatus("error");
        setMessage(response.status === 401 ? "Sign in to accept this collection invitation." : "This invitation is invalid, expired, or already used.");
        return;
      }
      const data = await response.json() as { link: LinkPreview };
      setPreview(data.link);
      setStatus("ready");
    }
    void load();
  }, [token]);

  async function accept() {
    const response = await fetch(browserApiUrl(`/lists/share-links/${token}/accept`), {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      setMessage("The invitation could not be accepted.");
      return;
    }
    router.push("/list");
  }

  return (
    <section className="page invite-page">
      <div className="invite-panel">
        <h1 className="page__title">Collection invitation</h1>
        {status === "loading" && <p>Loading invitation...</p>}
        {status === "error" && <>
          <p>{message}</p>
          <Link className="button button--primary" href="/auth/login">Sign in</Link>
        </>}
        {status === "ready" && preview && <>
          <p><strong>{preview.owner_display_name}</strong> (@{preview.owner_username}) invited you to view:</p>
          <h2>{preview.name}</h2>
          {preview.description && <p>{preview.description}</p>}
          <p className="muted">{preview.kind} collection</p>
          <div className="form-actions">
            <button className="button button--primary" type="button" disabled={preview.is_owner} onClick={() => void accept()}>{preview.is_owner ? "You own this collection" : "Accept invitation"}</button>
            <Link className="button button--ghost" href="/list">View collections</Link>
          </div>
          {message && <p role="status">{message}</p>}
        </>}
      </div>
    </section>
  );
}
