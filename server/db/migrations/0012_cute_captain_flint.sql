ALTER TABLE `amortization` ADD `tax_part` integer;--> statement-breakpoint
ALTER TABLE `amortization` ADD `insurance_part` integer;--> statement-breakpoint
ALTER TABLE `loans` ADD `kind` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` ADD `tax_bps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` ADD `insurance_bps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` ADD `fees_upfront` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` ADD `first_due_date` text;--> statement-breakpoint
ALTER TABLE `loans` ADD `first_period_days` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `loans` ADD `archived` integer DEFAULT false NOT NULL;