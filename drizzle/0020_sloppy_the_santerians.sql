ALTER TABLE "brand_builder_chats" ADD COLUMN "message_history" jsonb;--> statement-breakpoint
ALTER TABLE "brand_builder_chats" ADD COLUMN "logo_history" jsonb;--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD COLUMN "mockPages" text;