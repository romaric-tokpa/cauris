DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "accounts_user_idx";--> statement-breakpoint
DROP INDEX "amortization_user_idx";--> statement-breakpoint
DROP INDEX "amortization_loan_idx";--> statement-breakpoint
DROP INDEX "budgets_user_idx";--> statement-breakpoint
DROP INDEX "categories_user_idx";--> statement-breakpoint
DROP INDEX "category_summaries_user_idx";--> statement-breakpoint
DROP INDEX "category_summaries_user_cat_month_uq";--> statement-breakpoint
DROP INDEX "contributions_user_idx";--> statement-breakpoint
DROP INDEX "contributions_goal_idx";--> statement-breakpoint
DROP INDEX "goals_user_idx";--> statement-breakpoint
DROP INDEX "loan_payments_user_idx";--> statement-breakpoint
DROP INDEX "loan_payments_loan_idx";--> statement-breakpoint
DROP INDEX "loans_user_idx";--> statement-breakpoint
DROP INDEX "monthly_summaries_user_idx";--> statement-breakpoint
DROP INDEX "monthly_summaries_user_month_uq";--> statement-breakpoint
DROP INDEX "notifications_user_idx";--> statement-breakpoint
DROP INDEX "recurrences_user_idx";--> statement-breakpoint
DROP INDEX "transactions_user_idx";--> statement-breakpoint
DROP INDEX "transactions_account_idx";--> statement-breakpoint
DROP INDEX "transactions_category_idx";--> statement-breakpoint
ALTER TABLE `monthly_summaries` ALTER COLUMN "revenus" TO "revenus" integer;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `amortization_user_idx` ON `amortization` (`user_id`);--> statement-breakpoint
CREATE INDEX `amortization_loan_idx` ON `amortization` (`loan_id`);--> statement-breakpoint
CREATE INDEX `budgets_user_idx` ON `budgets` (`user_id`);--> statement-breakpoint
CREATE INDEX `categories_user_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `category_summaries_user_idx` ON `category_summaries` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `category_summaries_user_cat_month_uq` ON `category_summaries` (`user_id`,`category_id`,`month`);--> statement-breakpoint
CREATE INDEX `contributions_user_idx` ON `contributions` (`user_id`);--> statement-breakpoint
CREATE INDEX `contributions_goal_idx` ON `contributions` (`goal_id`);--> statement-breakpoint
CREATE INDEX `goals_user_idx` ON `goals` (`user_id`);--> statement-breakpoint
CREATE INDEX `loan_payments_user_idx` ON `loan_payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `loan_payments_loan_idx` ON `loan_payments` (`loan_id`);--> statement-breakpoint
CREATE INDEX `loans_user_idx` ON `loans` (`user_id`);--> statement-breakpoint
CREATE INDEX `monthly_summaries_user_idx` ON `monthly_summaries` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_summaries_user_month_uq` ON `monthly_summaries` (`user_id`,`month`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `recurrences_user_idx` ON `recurrences` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
ALTER TABLE `monthly_summaries` ALTER COLUMN "depenses" TO "depenses" integer;--> statement-breakpoint
ALTER TABLE `monthly_summaries` ALTER COLUMN "epargne" TO "epargne" integer;