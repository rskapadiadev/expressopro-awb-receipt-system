ALTER TABLE `branches` ADD `receipt_start` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `receipts` ADD `receipt_no` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `receipts_branch_receipt_no` ON `receipts` (`branch_id`,`receipt_no`);--> statement-breakpoint
-- Number existing receipts per branch in booking order.
UPDATE `receipts` SET `receipt_no` = `n`.`rn`
FROM (
    SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `branch_id` ORDER BY `created_at`, `id`) AS `rn`
    FROM `receipts` WHERE `branch_id` IS NOT NULL
) AS `n`
WHERE `receipts`.`id` = `n`.`id`;
--> statement-breakpoint
-- Templates that placed the old manual "receipt_no" field now show the automatic receipt number.
UPDATE `templates` SET
    `layout` = json_set(`layout`, '$.elements', (
        SELECT json_group_array(
            CASE WHEN json_extract(`e`.`value`, '$.kind') = 'field' AND json_extract(`e`.`value`, '$.fieldKey') = 'receipt_no'
                THEN json_remove(json_set(`e`.`value`, '$.kind', 'receiptNo'), '$.fieldKey')
                ELSE json(`e`.`value`)
            END
        ) FROM json_each(`layout`, '$.elements') AS `e`
    )),
    `version` = `version` + 1
WHERE `layout` LIKE '%"receipt_no"%';
--> statement-breakpoint
-- The manual field is retired (old receipts keep showing their typed value via their snapshot).
UPDATE `field_definitions` SET `is_active` = 0 WHERE `key` = 'receipt_no';
