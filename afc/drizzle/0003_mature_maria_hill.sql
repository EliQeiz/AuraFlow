CREATE INDEX `idx_courses_institution_teacher` ON `courses` (`institution_id`,`teacher_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_expiry` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_users_institution_role_name` ON `users` (`institution_id`,`role`,`name`);