"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Enrollment {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/**
 * Admin 2FA (TOTP) enrollment / disable panel.
 * Flow: begin → scan QR in authenticator → confirm with a live code → enforced
 * at every admin sign-in. Disabling also requires a live code.
 */
export default function AdminTwoFactorPanel() {
  const queryClient = useQueryClient();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-2fa"],
    queryFn: async () => {
      const res = await fetch("/api/admin/2fa");
      if (!res.ok) throw new Error("Failed to load 2FA status");
      return res.json() as Promise<{ enabled: boolean }>;
    },
    staleTime: 30_000,
  });

  async function act(action: "begin" | "confirm" | "disable") {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token: token.replace(/\s+/g, "") }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      } & Partial<Enrollment>;
      if (!res.ok) throw new Error(body.error ?? "Action failed");

      if (action === "begin" && body.secret) {
        setEnrollment({
          secret: body.secret,
          otpauthUrl: body.otpauthUrl ?? "",
          qrDataUrl: body.qrDataUrl ?? "",
        });
      }
      if (action === "confirm") {
        setMessage("Two-factor authentication is now enabled.");
        setEnrollment(null);
        setToken("");
      }
      if (action === "disable") {
        setMessage("Two-factor authentication has been disabled.");
        setToken("");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-2fa"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const enabled = data?.enabled === true;

  return (
    <div className="admin-panel" style={{ marginBottom: "1.5rem" }}>
      <div className="admin-panel__header">
        <h2 className="admin-panel__title">Security — Two-factor authentication</h2>
      </div>
      <div className="admin-panel__body">
        {isLoading ? (
          <p style={{ margin: 0, color: "var(--admin-muted)" }}>Loading…</p>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              Status:{" "}
              <strong>{enabled ? "Enabled (TOTP app)" : "Disabled"}</strong>
            </p>

            {!enabled && !enrollment ? (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => void act("begin")}
                disabled={busy}
              >
                Set up authenticator app
              </button>
            ) : null}

            {enrollment ? (
              <div style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- QR is a local data URL */}
                <img
                  src={enrollment.qrDataUrl}
                  alt="QR code for authenticator app"
                  width={220}
                  height={220}
                  style={{ borderRadius: 8 }}
                />
                <p style={{ margin: 0, wordBreak: "break-all", color: "var(--admin-muted)", fontSize: 12 }}>
                  Manual setup key: <code>{enrollment.secret}</code>
                </p>
                <label htmlFor="totp-confirm">
                  Enter the 6-digit code from your app to finish setup:
                </label>
                <input
                  id="totp-confirm"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  style={{
                    background: "var(--admin-bg-elevated, #141416)",
                    color: "inherit",
                    border: "1px solid #2a2a2e",
                    borderRadius: 6,
                    padding: "0.5rem",
                  }}
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    onClick={() => void act("confirm")}
                    disabled={busy || token.trim().length < 6}
                  >
                    Confirm & enable
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                      setEnrollment(null);
                      setError(null);
                    }}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {enabled ? (
              <div style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
                <label htmlFor="totp-disable">
                  Enter a current code to turn two-factor off:
                </label>
                <input
                  id="totp-disable"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={7}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  style={{
                    background: "var(--admin-bg-elevated, #141416)",
                    color: "inherit",
                    border: "1px solid #2a2a2e",
                    borderRadius: 6,
                    padding: "0.5rem",
                  }}
                />
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => void act("disable")}
                  disabled={busy || token.trim().length < 6}
                >
                  Disable two-factor
                </button>
              </div>
            ) : null}

            {message ? (
              <p role="status" style={{ color: "#22c55e", marginBottom: 0 }}>
                {message}
              </p>
            ) : null}
            {error ? (
              <p role="alert" style={{ color: "#ef4444", marginBottom: 0 }}>
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
