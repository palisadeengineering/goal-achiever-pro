CREATE TABLE "time_block_leverage_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_block_id" uuid NOT NULL,
	"leverage_item_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "time_blocks" ADD COLUMN "leverage_type" text;--> statement-breakpoint
ALTER TABLE "time_block_leverage_links" ADD CONSTRAINT "time_block_leverage_links_time_block_id_time_blocks_id_fk" FOREIGN KEY ("time_block_id") REFERENCES "public"."time_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_block_leverage_links" ADD CONSTRAINT "time_block_leverage_links_leverage_item_id_leverage_items_id_fk" FOREIGN KEY ("leverage_item_id") REFERENCES "public"."leverage_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "time_block_leverage_links_block_leverage_idx" ON "time_block_leverage_links" USING btree ("time_block_id","leverage_item_id");--> statement-breakpoint
CREATE INDEX "time_block_leverage_links_leverage_idx" ON "time_block_leverage_links" USING btree ("leverage_item_id");