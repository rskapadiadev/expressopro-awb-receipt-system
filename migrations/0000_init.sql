CREATE TABLE `counters` (
	`name` text PRIMARY KEY NOT NULL,
	`value` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `field_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`options` text DEFAULT '[]' NOT NULL,
	`searchable` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `field_definitions_key_unique` ON `field_definitions` (`key`);--> statement-breakpoint
CREATE TABLE `receipts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`awb_number` text NOT NULL,
	`template_id` integer NOT NULL,
	`layout_snapshot` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `receipts_awb_number_unique` ON `receipts` (`awb_number`);--> statement-breakpoint
CREATE INDEX `receipts_created_at_idx` ON `receipts` (`created_at`);--> statement-breakpoint
CREATE INDEX `receipts_created_by_idx` ON `receipts` (`created_by`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`layout` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_templates` (
	`user_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`user_id`, `template_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);