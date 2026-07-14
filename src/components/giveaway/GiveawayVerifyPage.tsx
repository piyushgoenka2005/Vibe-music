"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/lib/routes";

export default function GiveawayVerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    () => (token ? "loading" : "idle")
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/giveaway/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Verification failed");
        setStatus("ok");
        setMessage(`Entry ${json.entry?.entryNumber ?? ""} verified.`);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [token]);

  return (
    <main className="storefront-page giveaway-page">
      <section className="giveaway-card">
        <h1>Email verification</h1>
        {status === "loading" || status === "idle" ? <p>Verifying…</p> : null}
        {status === "ok" ? <p>{message}</p> : null}
        {status === "error" ? <p className="giveaway-error">{message}</p> : null}
        <Link href={ROUTES.giveaway} className="btn btn--primary">
          Back to giveaways
        </Link>
      </section>
    </main>
  );
}
