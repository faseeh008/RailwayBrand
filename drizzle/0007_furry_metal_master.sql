CREATE TABLE "generated_slides" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"brandGuidelinesId" text NOT NULL,
	"slideTitle" text NOT NULL,
	"slideNumber" integer NOT NULL,
	"htmlContent" text NOT NULL,
	"slideType" text NOT NULL,
	"slideData" text,
	"thumbnailPath" text,
	"thumbnailData" text,
	"generationSettings" text,
	"status" text DEFAULT 'completed',
	"errorMessage" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD COLUMN "logoData" text;--> statement-breakpoint
ALTER TABLE "generated_slides" ADD CONSTRAINT "generated_slides_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_slides" ADD CONSTRAINT "generated_slides_brandGuidelinesId_brand_guidelines_id_fk" FOREIGN KEY ("brandGuidelinesId") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;