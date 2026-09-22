CREATE TABLE `academic_terms` (
	`id` text PRIMARY KEY NOT NULL,
	`institution_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `term_name` ON `academic_terms` (`institution_id`,`name`);--> statement-breakpoint
CREATE TABLE `account_controls` (
	`user_id` text PRIMARY KEY NOT NULL,
	`suspended` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `course_allocations` (
	`course_id` text PRIMARY KEY NOT NULL,
	`department_id` text,
	`term_id` text,
	`revision` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `academic_terms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`institution_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `department_code` ON `departments` (`institution_id`,`code`);--> statement-breakpoint
CREATE TABLE `grade_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attempt_id` text NOT NULL,
	`revision` integer NOT NULL,
	`actor_id` text,
	`reason` text NOT NULL,
	`old_score` integer,
	`new_score` integer,
	`old_released` integer,
	`new_released` integer NOT NULL,
	`old_feedback` text,
	`new_feedback` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grade_history_revision` ON `grade_history` (`attempt_id`,`revision`);--> statement-breakpoint
CREATE TABLE `session_details` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`device` text NOT NULL,
	FOREIGN KEY (`token_hash`) REFERENCES `sessions`(`token_hash`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_details_token_hash_unique` ON `session_details` (`token_hash`);--> statement-breakpoint
ALTER TABLE `attempts` ADD `revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `attempts` ADD `change_actor` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `attempts` ADD `change_reason` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TRIGGER grade_change_history AFTER UPDATE OF score, released, feedback ON attempts
WHEN OLD.score IS NOT NEW.score OR OLD.released IS NOT NEW.released OR OLD.feedback IS NOT NEW.feedback
BEGIN
  INSERT INTO grade_history(attempt_id,revision,actor_id,reason,old_score,new_score,old_released,new_released,old_feedback,new_feedback,created_at)
  VALUES(NEW.id,OLD.revision+1,NEW.change_actor,CASE WHEN NEW.change_reason='' THEN 'Automatic assessment scoring' ELSE NEW.change_reason END,OLD.score,NEW.score,OLD.released,NEW.released,OLD.feedback,NEW.feedback,CAST(strftime('%s','now') AS INTEGER)*1000);
  UPDATE attempts SET revision=OLD.revision+1 WHERE id=NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER grade_initial_history AFTER INSERT ON attempts WHEN NEW.score IS NOT NULL
BEGIN
  INSERT INTO grade_history(attempt_id,revision,actor_id,reason,new_score,new_released,new_feedback,created_at)
  VALUES(NEW.id,1,NEW.change_actor,CASE WHEN NEW.change_reason='' THEN 'Initial assessed result' ELSE NEW.change_reason END,NEW.score,NEW.released,NEW.feedback,CAST(strftime('%s','now') AS INTEGER)*1000);
  UPDATE attempts SET revision=1 WHERE id=NEW.id;
END;
