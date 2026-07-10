"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { getLoginRedirectUrl } from "@/lib/auth/protected-routes";
import { useAuthStore } from "@/store/authStore";

interface ProductQuestionFormProps {
  productSlug: string;
  onSubmitted?: () => void;
}

export default function ProductQuestionForm({
  productSlug,
  onSubmitted,
}: ProductQuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const productPath = `/product/${productSlug}`;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productSlug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setNeedsLogin(true);
        throw new Error("Sign in to ask a question.");
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to submit question");
      }
    },
    onSuccess: () => {
      setQuestion("");
      setNeedsLogin(false);
      setMessage("Thanks! Your question was submitted and will appear after review.");
      onSubmitted?.();
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="pdp-qa-form">
        <h4 className="pdp-qa-form__title">Ask a question</h4>
        <p className="pdp-qa-form__message">
          Sign in to ask about this product. We&apos;ll notify you when it&apos;s answered.
        </p>
        <Link
          href={getLoginRedirectUrl(productPath)}
          className="pdp-qa-form__submit"
          style={{ display: "inline-block", textAlign: "center", textDecoration: "none" }}
        >
          Sign in to ask
        </Link>
      </div>
    );
  }

  return (
    <form
      className="pdp-qa-form"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setNeedsLogin(false);
        mutation.mutate();
      }}
    >
      <h4 className="pdp-qa-form__title">Ask a question</h4>
      <textarea
        className="pdp-qa-form__input"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What would you like to know about this product?"
        rows={3}
        minLength={10}
        maxLength={500}
        required
      />
      <button
        type="submit"
        className="pdp-qa-form__submit"
        disabled={mutation.isPending || question.trim().length < 10}
      >
        {mutation.isPending ? "Submitting…" : "Submit question"}
      </button>
      {needsLogin ? (
        <p className="pdp-qa-form__message">
          <Link href={getLoginRedirectUrl(productPath)}>Sign in</Link> to submit your question.
        </p>
      ) : null}
      {message ? <p className="pdp-qa-form__message">{message}</p> : null}
    </form>
  );
}
