ALTER TABLE `courses` ADD `level` text DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `price_ghs` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `youtube_playlist_id` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `certificate_enabled` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `assessments` ADD `integrity_mode` text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
CREATE TABLE `assessment_integrity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `idx_integrity_attempt_created` ON `assessment_integrity_events` (`attempt_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `course_certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`certificate_code` text NOT NULL,
	`issued_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_course_learner` ON `course_certificates` (`course_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_code_unique` ON `course_certificates` (`certificate_code`);
