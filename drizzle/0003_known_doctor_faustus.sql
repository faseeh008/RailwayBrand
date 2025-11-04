CREATE TABLE "brand_guidelines" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"brandName" text NOT NULL,
	"content" text NOT NULL,
	"brandValues" text,
	"industry" text,
	"mood" text,
	"audience" text,
	"customPrompt" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_guidelines" ADD CONSTRAINT "brand_guidelines_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;