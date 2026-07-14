-- CreateTable
CREATE TABLE "finance_providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bank',
    "logo_url" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "min_order_value" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "max_order_value" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "processing_fee_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "finance_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_plans" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenure_months" INTEGER NOT NULL,
    "interest_rate_annual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_no_cost_emi" BOOLEAN NOT NULL DEFAULT false,
    "emi_type" TEXT NOT NULL DEFAULT 'card',
    "min_order_value" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "max_order_value" DOUBLE PRECISION NOT NULL DEFAULT 500000,
    "down_payment_min_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "finance_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_applications" (
    "id" TEXT NOT NULL,
    "application_number" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "product_name" TEXT NOT NULL,
    "product_slug" TEXT,
    "order_value" DOUBLE PRECISION NOT NULL,
    "down_payment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tenure_months" INTEGER NOT NULL,
    "provider_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "emi_type" TEXT NOT NULL,
    "monthly_installment" DOUBLE PRECISION NOT NULL,
    "total_payable" DOUBLE PRECISION NOT NULL,
    "interest_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processing_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "rejection_reason" TEXT,
    "pan_number" TEXT,
    "employment_type" TEXT,
    "monthly_income" DOUBLE PRECISION,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "approved_at" TEXT,
    "rejected_at" TEXT,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    CONSTRAINT "finance_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_application_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "created_by" TEXT,
    "created_at" TEXT NOT NULL,
    CONSTRAINT "finance_application_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finance_providers_slug_key" ON "finance_providers"("slug");
CREATE INDEX "finance_providers_status_idx" ON "finance_providers"("status");
CREATE INDEX "finance_plans_provider_id_idx" ON "finance_plans"("provider_id");
CREATE INDEX "finance_plans_status_idx" ON "finance_plans"("status");
CREATE INDEX "finance_plans_emi_type_idx" ON "finance_plans"("emi_type");
CREATE UNIQUE INDEX "finance_applications_application_number_key" ON "finance_applications"("application_number");
CREATE INDEX "finance_applications_user_id_idx" ON "finance_applications"("user_id");
CREATE INDEX "finance_applications_email_idx" ON "finance_applications"("email");
CREATE INDEX "finance_applications_status_idx" ON "finance_applications"("status");
CREATE INDEX "finance_applications_provider_id_idx" ON "finance_applications"("provider_id");
CREATE INDEX "finance_applications_created_at_idx" ON "finance_applications"("created_at");
CREATE INDEX "finance_application_events_application_id_idx" ON "finance_application_events"("application_id");
CREATE INDEX "finance_application_events_created_at_idx" ON "finance_application_events"("created_at");

ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "finance_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_applications" ADD CONSTRAINT "finance_applications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "finance_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_applications" ADD CONSTRAINT "finance_applications_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "finance_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "finance_application_events" ADD CONSTRAINT "finance_application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "finance_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
