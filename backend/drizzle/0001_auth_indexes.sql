CREATE UNIQUE INDEX IF NOT EXISTS `users_phone_uidx` ON `users` (`phone`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `users_email_idx` ON `users` (`email`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `otp_codes_identifier_purpose_idx` ON `otp_codes` (`identifier`, `purpose`);
