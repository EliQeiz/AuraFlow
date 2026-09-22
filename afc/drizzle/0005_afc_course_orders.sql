CREATE TABLE `course_orders` (
	`reference` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE INDEX `idx_course_orders_learner` ON `course_orders` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_course_orders_course` ON `course_orders` (`course_id`,`status`);
