"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductQA } from "@/types/product";
import ProductQuestionForm from "./ProductQuestionForm";

interface ProductQASectionProps {
  productSlug: string;
  staticQa: ProductQA[];
}

export default function ProductQASection({
  productSlug,
  staticQa,
}: ProductQASectionProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["product-questions", productSlug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productSlug}/questions`);
      if (!res.ok) throw new Error("Failed to load questions");
      return res.json() as Promise<{
        questions: Array<{
          id: string;
          question: string;
          answer?: string;
          author: string;
          createdAt: string;
        }>;
      }>;
    },
  });

  const liveQuestions =
    data?.questions
      .filter((item) => item.answer?.trim())
      .map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer ?? "",
        author: "Vibe Music",
        date: item.createdAt,
      })) ?? [];

  const pendingQuestions =
    data?.questions
      .filter((item) => !item.answer?.trim())
      .map((item) => ({
        id: item.id,
        question: item.question,
        date: item.createdAt,
      })) ?? [];

  const merged = [...liveQuestions, ...staticQa];
  const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());

  return (
    <div className="pdp-qa-section">
      <ProductQuestionForm
        productSlug={productSlug}
        onSubmitted={() =>
          queryClient.invalidateQueries({ queryKey: ["product-questions", productSlug] })
        }
      />

      {isLoading ? (
        <p className="pdp-sections__status">Loading questions…</p>
      ) : (
        <>
          {pendingQuestions.length > 0 ? (
            <div className="pdp-qa-pending" aria-label="Pending questions">
              <p className="pdp-sections__status">
                {pendingQuestions.length} question
                {pendingQuestions.length === 1 ? "" : "s"} awaiting review.
              </p>
              <div className="pdp-sections__panel">
                {pendingQuestions.map((item) => (
                  <article key={item.id} className="pdp-qa pdp-qa--pending">
                    <p className="pdp-qa__q">Q: {item.question}</p>
                    <p className="pdp-qa__a">Awaiting answer from Vibe Music.</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {unique.length === 0 ? (
            <p className="pdp-sections__empty">
              No answered questions yet. Be the first to ask.
            </p>
          ) : (
            <div className="pdp-sections__panel">
              {unique.map((item) => (
                <article key={item.id} className="pdp-qa">
                  <p className="pdp-qa__q">Q: {item.question}</p>
                  <p className="pdp-qa__a">
                    A: {item.answer} — <em>{item.author}</em>
                  </p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
