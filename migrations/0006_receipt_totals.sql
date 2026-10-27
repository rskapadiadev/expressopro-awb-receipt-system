CREATE TABLE `receipt_totals` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`total` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
-- Backfill from existing receipts so totals are correct from the start.
INSERT INTO `receipt_totals` (`user_id`, `total`) SELECT 0, count(*) FROM `receipts`;
--> statement-breakpoint
INSERT INTO `receipt_totals` (`user_id`, `total`) SELECT `created_by`, count(*) FROM `receipts` GROUP BY `created_by`;
--> statement-breakpoint
-- Triggers keep totals right for every write path (API, demo seed, clean-up) so dashboards never count all rows.
CREATE TRIGGER `receipts_total_insert` AFTER INSERT ON `receipts` BEGIN
    INSERT INTO `receipt_totals` (`user_id`, `total`) VALUES (0, 1), (NEW.`created_by`, 1)
    ON CONFLICT (`user_id`) DO UPDATE SET `total` = `total` + 1;
END;
--> statement-breakpoint
CREATE TRIGGER `receipts_total_delete` AFTER DELETE ON `receipts` BEGIN
    UPDATE `receipt_totals` SET `total` = `total` - 1 WHERE `user_id` IN (0, OLD.`created_by`);
END;
