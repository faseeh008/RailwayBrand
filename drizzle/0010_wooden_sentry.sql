CREATE TABLE "analysis_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_guideline_id" text,
	"website_url" text NOT NULL,
	"website_title" varchar(255),
	"violations" jsonb,
	"correct_elements" jsonb,
	"score" integer,
	"total_violations" integer,
	"severity_breakdown" jsonb,
	"issues" jsonb,
	"recommendations" jsonb,
	"category_scores" jsonb,
	"screenshot" text,
	"annotated_screenshot" text,
	"fix_prompt" text,
	"analysis_type" varchar(50),
	"processing_time" integer,
	"elements_analyzed" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"session_name" varchar(255),
	"description" text,
	"total_webpages" integer DEFAULT 0,
	"compliant_webpages" integer DEFAULT 0,
	"average_score" real,
	"status" varchar(50) DEFAULT 'active',
	"is_active" boolean DEFAULT true,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"webpage_id" integer NOT NULL,
	"issue_type" varchar(100) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"element" text,
	"expected_value" text,
	"actual_value" text,
	"recommendation" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pdfs_brand_guidelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"industry" varchar(100),
	"colors" jsonb,
	"typography" jsonb,
	"logo" jsonb,
	"ui" jsonb,
	"spacing" jsonb,
	"layout" jsonb,
	"imagery" jsonb,
	"tone" jsonb,
	"accessibility" jsonb,
	"global_rules" jsonb,
	"metadata" jsonb,
	"source_file" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pdfs_brand_guidelines_brand_name_unique" UNIQUE("brand_name")
);
--> statement-breakpoint
CREATE TABLE "scraped_webpages" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(1000) NOT NULL,
	"domain" varchar(255),
	"brand_id" text,
	"colors" jsonb,
	"typography" jsonb,
	"logo" jsonb,
	"layout" jsonb,
	"imagery" jsonb,
	"metadata" jsonb,
	"compliance_score" real,
	"issues" jsonb,
	"recommendations" jsonb,
	"screenshot" text,
	"status" varchar(50) DEFAULT 'scraped',
	"is_active" boolean DEFAULT true,
	"scraped_at" timestamp DEFAULT now(),
	"analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_brand_guideline_id_brand_guidelines_id_fk" FOREIGN KEY ("brand_guideline_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_sessions" ADD CONSTRAINT "audit_sessions_brand_id_brand_guidelines_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_issues" ADD CONSTRAINT "compliance_issues_webpage_id_scraped_webpages_id_fk" FOREIGN KEY ("webpage_id") REFERENCES "public"."scraped_webpages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scraped_webpages" ADD CONSTRAINT "scraped_webpages_brand_id_brand_guidelines_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;