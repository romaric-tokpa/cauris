PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`cap` integer NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`txn_count` integer DEFAULT 0 NOT NULL,
	`period` text NOT NULL,
	`frequency` text DEFAULT 'Mensuel' NOT NULL,
	`alert_pct` integer DEFAULT 90 NOT NULL,
	`rollover` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_budgets`("id", "user_id", "category_id", "cap", "spent", "txn_count", "period", "frequency", "alert_pct", "rollover", "archived", "created_at", "updated_at") SELECT "id", "user_id", "category_id", "cap", "spent", "txn_count", "period", "frequency", "alert_pct", "rollover", "archived", "created_at", "updated_at" FROM `budgets`;--> statement-breakpoint
DROP TABLE `budgets`;--> statement-breakpoint
ALTER TABLE `__new_budgets` RENAME TO `budgets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `budgets_user_idx` ON `budgets` (`user_id`);