# Humanity-AI.Quest — Database Schema

## Tables

### `users`
Registered user accounts. Self-migrating (created by signup.js / login.js).

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'user',                -- 'user' | 'admin'
  acl_level INTEGER DEFAULT 0,              -- 0=user, 1=viewer, 2=mod, 3=editor, 4=manager, 5=super admin
  status TEXT DEFAULT 'active',             -- 'active' | 'suspended' | 'banned'
  ban_reason TEXT,
  phone TEXT,
  country TEXT,
  newsletter INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email lookup (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
```

### `sessions`
Active login sessions. Expires after 30 days. Self-migrating (created by login.js / signup.js).

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cleanup: DELETE FROM sessions WHERE expires_at < datetime('now')
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
```

### `ideas`
User-submitted ideas about HRC clauses. Auto-migrating (see me.js).

```sql
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',          -- 'submitted' | 'in_review' | 'approved' | 'rejected'
  clause_refs TEXT,                         -- JSON array of clause IDs
  conversation_id TEXT,                     -- Link to agent conversation if submitted from chat
  ledger_hash TEXT,
  prev_hash TEXT,
  tags TEXT,                                -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ideas_user ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideas(created_at DESC);
```

### `idea_status_log`
Audit trail for idea status changes and admin comments.

```sql
CREATE TABLE IF NOT EXISTS idea_status_log (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  admin_id TEXT REFERENCES users(id),
  old_status TEXT,
  new_status TEXT,
  comment TEXT,
  visible_to_user INTEGER DEFAULT 1,        -- Only show user-facing comments (not internal notes)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_idea_status_log_idea ON idea_status_log(idea_id);
```

### `conversations`
Chat conversations with the HRC Agent. Self-migrating (see chat.js).

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),        -- NULL for anonymous visitors
  mode TEXT DEFAULT 'explain',              -- 'explain' | 'debate' | 'survey' | 'brainstorm'
  title TEXT,                               -- Auto-generated from first user message
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
```

### `messages`
Individual messages within conversations (user + assistant alternating).

```sql
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL,                       -- 'user' | 'assistant'
  content TEXT NOT NULL,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
```

### `admin_actions`
Audit log of all admin actions (for transparency and recovery).

```sql
CREATE TABLE IF NOT EXISTS admin_actions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL,                -- 'ban' | 'suspend' | 'activate' | 'set_admin' | 'revoke_admin' | 'update_idea' | etc.
  target_type TEXT,                         -- 'user' | 'idea' | 'conversation' | etc.
  target_id TEXT,
  details TEXT,                             -- Human-readable description or JSON payload
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
```

## Key Design Decisions

- **No manual migrations**: All tables use idempotent `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN` in try/catch blocks. Each endpoint ensures its required tables exist on startup.
- **Email is canonical for user identity**: Always normalized with `.toLowerCase().trim()`. A unique index on `LOWER(email)` prevents duplicates.
- **Sessions auto-expire**: Front-end should clean up expired sessions periodically or on login (cleanup in login.js line 44).
- **Admin actions are logged**: Every privileged operation creates an `admin_actions` entry for transparency and auditability.
- **Conversations can be anonymous**: `user_id` is NULL for visitor sessions; logged-in users always have `user_id`.
- **Ideas link back to conversations**: If a user submits an idea from the agent chat, `conversation_id` preserves that context.

## ACL Levels

```
0 = Regular user (default)
1 = Viewer (can see admin dashboard read-only)
2 = Moderator (can flag/moderate ideas)
3 = Editor (can edit ideas and proposals)
4 = Manager (can ban/suspend users, approve ideas)
5 = Super Admin (full access, can promote other admins up to L4)
```

**ACL Check Rule**: `user.role === 'admin' AND user.acl_level >= minLevel`
(Both conditions must be true.)
