export type BannerStatus = "active" | "inactive";

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  ctaText: string;
  ctaLink: string;
  startDate?: string | null;
  endDate?: string | null;
  priority: number;
  status: BannerStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateBannerInput = Omit<
  HomepageBanner,
  "id" | "createdAt" | "updatedAt" | "priority"
> & {
  priority?: number;
};

export type UpdateBannerInput = Partial<CreateBannerInput>;
