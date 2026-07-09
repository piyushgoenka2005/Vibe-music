export type ProductQuestionStatus = "pending" | "approved" | "rejected";

export interface ProductQuestion {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId?: string;
  author: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  status: ProductQuestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuestionListResponse {
  questions: ProductQuestion[];
  totalCount: number;
}
