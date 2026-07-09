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
        <p className="pdp-tabs__empty">Loading questions…</p>
      ) : unique.length === 0 ? (
        <p className="pdp-tabs__empty">No questions yet. Be the first to ask.</p>
      ) : (
        unique.map((item) => (
          <article key={item.id} className="pdp-qa">
            <p className="pdp-qa__q">Q: {item.question}</p>
            <p className="pdp-qa__a">
              A: {item.answer} — <em>{item.author}</em>
            </p>
          </article>
        ))
      )}
    </div>
  );
}
