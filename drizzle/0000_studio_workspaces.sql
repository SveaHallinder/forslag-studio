CREATE TABLE studio_workspaces (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE studio_members (workspace_id TEXT NOT NULL REFERENCES studio_workspaces(id), user_id TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','member')), PRIMARY KEY(workspace_id,user_id));
--> statement-breakpoint
CREATE TABLE studio_invites (token_hash TEXT PRIMARY KEY NOT NULL, workspace_id TEXT NOT NULL REFERENCES studio_workspaces(id), email TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT);
--> statement-breakpoint
CREATE TABLE studio_projects (workspace_id TEXT NOT NULL REFERENCES studio_workspaces(id), id TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, PRIMARY KEY(workspace_id,id));
--> statement-breakpoint
CREATE TABLE studio_forms (id TEXT PRIMARY KEY NOT NULL, workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, title TEXT NOT NULL, accent TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('contact','booking')), active INTEGER NOT NULL DEFAULT 1, UNIQUE(workspace_id,project_id), FOREIGN KEY(workspace_id,project_id) REFERENCES studio_projects(workspace_id,id));
--> statement-breakpoint
CREATE TABLE studio_requests (id TEXT PRIMARY KEY NOT NULL, form_id TEXT NOT NULL REFERENCES studio_forms(id), nonce TEXT NOT NULL, visitor_hash TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, visit_at TEXT NOT NULL DEFAULT '', state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','read')), created_at TEXT NOT NULL, UNIQUE(form_id,nonce));
--> statement-breakpoint
CREATE INDEX studio_requests_rate ON studio_requests(form_id,visitor_hash,created_at);
--> statement-breakpoint
CREATE INDEX studio_members_user ON studio_members(user_id);
