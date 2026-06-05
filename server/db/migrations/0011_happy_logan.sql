CREATE TABLE `envelopes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`cap` integer NOT NULL,
	`period` text NOT NULL,
	`last_reconciled_at` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `envelopes_user_idx` ON `envelopes` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `envelopes_account_uq` ON `envelopes` (`account_id`);