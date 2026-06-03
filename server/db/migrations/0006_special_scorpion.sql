ALTER TABLE `budgets` ADD `frequency` text DEFAULT 'Mensuel' NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `alert_pct` integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `rollover` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `archived` integer DEFAULT false NOT NULL;