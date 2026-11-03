export interface Brand {
  id: string;
  name: string;
  slug: string;
  /** Optional logo shown in the brand strip and brands mega-menu. Falls back to a bundled asset. */
  logoUrl?: string;
}
