CREATE TABLE `branches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branches_code_unique` ON `branches` (`code`);--> statement-breakpoint
ALTER TABLE `receipts` ADD `branch_id` integer REFERENCES branches(id);--> statement-breakpoint
CREATE INDEX `receipts_branch_idx` ON `receipts` (`branch_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `branch_id` integer REFERENCES branches(id);