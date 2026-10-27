-- Carry existing per-user assignments over to each user's branch before dropping the old table.
INSERT OR IGNORE INTO `branch_templates` (`branch_id`, `template_id`, `is_default`)
SELECT `u`.`branch_id`, `ut`.`template_id`, 0
FROM `user_templates` `ut`
JOIN `users` `u` ON `u`.`id` = `ut`.`user_id`
WHERE `u`.`branch_id` IS NOT NULL;
--> statement-breakpoint
-- One default per branch: the first template any of its users had as default.
UPDATE `branch_templates` SET `is_default` = 1
WHERE `rowid` IN (
    SELECT min(`bt`.`rowid`)
    FROM `branch_templates` `bt`
    JOIN `user_templates` `ut` ON `ut`.`template_id` = `bt`.`template_id` AND `ut`.`is_default` = 1
    JOIN `users` `u` ON `u`.`id` = `ut`.`user_id` AND `u`.`branch_id` = `bt`.`branch_id`
    GROUP BY `bt`.`branch_id`
);
--> statement-breakpoint
DROP TABLE `user_templates`;
