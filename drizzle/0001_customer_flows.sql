CREATE TABLE studio_reservations (id TEXT PRIMARY KEY NOT NULL, form_id TEXT NOT NULL REFERENCES studio_forms(id), request_id TEXT NOT NULL UNIQUE REFERENCES studio_requests(id), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, time_zone TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'confirmed' CHECK(state IN ('confirmed','cancelled')), created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX studio_reservations_capacity ON studio_reservations(form_id,state,starts_at,ends_at);
--> statement-breakpoint
CREATE TABLE studio_email_jobs (id TEXT PRIMARY KEY NOT NULL, reservation_id TEXT NOT NULL REFERENCES studio_reservations(id), audience TEXT NOT NULL CHECK(audience IN ('customer','team')), payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','retry','sent','failed','unknown','cancelled')), attempts INTEGER NOT NULL DEFAULT 0, attempt_log TEXT NOT NULL DEFAULT '[]', first_attempt_at TEXT, next_attempt_at TEXT NOT NULL, lease_token TEXT, lease_until TEXT, provider_id TEXT, error TEXT NOT NULL DEFAULT '', sent_at TEXT, created_at TEXT NOT NULL, UNIQUE(reservation_id,audience));
--> statement-breakpoint
CREATE INDEX studio_email_jobs_queue ON studio_email_jobs(state,next_attempt_at,lease_until);
--> statement-breakpoint
CREATE TABLE studio_browser_jobs (id TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('render','agent')), user_id TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'page' CHECK(mode IN ('page','social')), url TEXT NOT NULL DEFAULT '', state TEXT NOT NULL CHECK(state IN ('pending','running','complete','failed','heartbeat')), lease_token TEXT, lease_until TEXT, result TEXT, error TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, expires_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX studio_browser_jobs_queue ON studio_browser_jobs(kind,state,created_at);
--> statement-breakpoint
CREATE INDEX studio_browser_jobs_owner ON studio_browser_jobs(user_id,created_at);
