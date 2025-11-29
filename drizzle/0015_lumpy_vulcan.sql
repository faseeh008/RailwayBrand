CREATE TABLE "mock_webpages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"brand_guidelines_id" text,
	"brand_name" text,
	"theme" text NOT NULL,
	"html_content" text NOT NULL,
	"brand_config" text,
	"slides_snapshot" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "generated_slides" ALTER COLUMN "htmlContent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ADD COLUMN "latest_logo_snapshot" text;--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "generated_slides" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "mock_webpages" ADD CONSTRAINT "mock_webpages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_webpages" ADD CONSTRAINT "mock_webpages_brand_guidelines_id_brand_guidelines_id_fk" FOREIGN KEY ("brand_guidelines_id") REFERENCES "public"."brand_guidelines"("id") ON DELETE cascade ON UPDATE no action;