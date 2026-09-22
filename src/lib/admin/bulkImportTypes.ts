/** Shared bulk-import types (safe for client + server). */

export type BulkImportDuplicateStrategy = "fail" | "skip" | "update";

export type BulkImportPublishStatus = "active" | "draft";

export type BulkImportRowAction = "create" | "update" | "skip";

export type BulkImportWizardStep = "upload" | "options" | "preview" | "importing" | "complete";

export interface BulkImportOptions {
  duplicateStrategy: BulkImportDuplicateStrategy;
  publishStatus: BulkImportPublishStatus;
}

export const DEFAULT_BULK_IMPORT_OPTIONS: BulkImportOptions = {
  duplicateStrategy: "fail",
  publishStatus: "active",
};

export interface BulkImportPreviewSummary {
  total: number;
  valid: number;
  invalid: number;
  creates: number;
  updates: number;
  skips: number;
  withImages: number;
  withoutImages: number;
  categories: Array<{ name: string; count: number }>;
  errorBreakdown: Array<{ message: string; count: number }>;
  emptyRowsSkipped: number;
}

export interface BulkImportApiSummary extends BulkImportPreviewSummary {
  valid: number;
  invalid: number;
}
