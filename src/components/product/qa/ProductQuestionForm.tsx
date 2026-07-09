"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

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

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${productSlug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to submit question");
      }
    },
    onSuccess: () => {
      setQuestion("");
      setMessage("Thanks! Your question was submitted and will appear after review.");
      onSubmitted?.();
    },
    onError: (error: Error) => {
      setMessage(error.message);
    },
  });

  return (
    <form
      className="pdp-qa-form"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
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
      {message ? <p className="pdp-qa-form__message">{message}</p> : null}
    </form>
  );
}
