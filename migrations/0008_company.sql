CREATE TABLE `company` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`tracking_link` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`gstin` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
-- The profile is a single row that is only ever updated.
INSERT INTO `company` (`id`) VALUES (1);
