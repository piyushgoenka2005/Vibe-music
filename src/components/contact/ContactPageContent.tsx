"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { NavArrowIcon } from "@/gp9/components/ui/nav-arrow-icon";
import { BRAND } from "@/lib/brand";

export default function ContactPageContent() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const querySubject = searchParams.get("subject")?.trim().slice(0, 160) ?? "";
  const queryMessage = searchParams.get("body")?.trim().slice(0, 4000) ?? "";
  const [subjectOverride, setSubjectOverride] = useState<string | null>(null);
  const [messageOverride, setMessageOverride] = useState<string | null>(null);
  const subject = subjectOverride ?? querySubject;
  const message = messageOverride ?? queryMessage;
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to send message");
      }
      setStatus("success");
      setFeedback(data.message ?? "Message sent.");
      setName("");
      setEmail("");
      setPhone("");
      setSubjectOverride("");
      setMessageOverride("");
    } catch (error) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Unable to send message"
      );
    }
  }

  return (
    <div className="storefront-page__inner contact-page">
      <header className="storefront-page__header">
        <p className="storefront-page__eyebrow">Support</p>
        <h1 className="storefront-page__title">Contact Vibe Music</h1>
        <p className="storefront-page__subtitle">
          Questions about orders, gear, or repairs? Send us a message and our team
          will get back to you.
        </p>
      </header>

      <div className="contact-page__grid">
        <section className="contact-page__card" aria-label="Contact details">
          <h2>Reach us directly</h2>
          <ul className="contact-page__channels">
            <li>
              <Mail size={18} aria-hidden />
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </li>
            {BRAND.phoneTel ? (
              <li>
                <Phone size={18} aria-hidden />
                <a href={`tel:${BRAND.phoneTel}`}>{BRAND.phoneDisplay}</a>
              </li>
            ) : null}
            <li>
              <MapPin size={18} aria-hidden />
              <span>{BRAND.address}</span>
            </li>
          </ul>
          <p className="contact-page__hint">
            Typical response time: 1–2 business days (Mon–Sat).
          </p>
        </section>

        <section className="contact-page__card">
          <h2>Send a message</h2>
          <form className="contact-page__form" onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              <span>Phone (optional)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>
            <label>
              <span>Subject</span>
              <input
                required
                value={subject}
                onChange={(e) => setSubjectOverride(e.target.value)}
              />
            </label>
            <label>
              <span>Message</span>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessageOverride(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="contact-page__submit group"
              disabled={status === "loading"}
            >
              <span className="contact-page__submit-label">
                {status === "loading" ? "Sending…" : "Send message"}
              </span>
              <NavArrowIcon
                size="sm"
                className="contact-page__submit-arrow"
              />
            </button>
            {feedback ? (
              <p
                className={`contact-page__feedback contact-page__feedback--${status}`}
                role={status === "error" ? "alert" : "status"}
              >
                {feedback}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </div>
  );
}
