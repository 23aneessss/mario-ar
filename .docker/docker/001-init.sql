CREATE TABLE IF NOT EXISTS photos (
  token text PRIMARY KEY CHECK (token ~ '^[A-Za-z0-9_-]{43}$'),
  idempotency_hash text NOT NULL UNIQUE,
  object_key text NOT NULL UNIQUE,
  content_hash text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','ready')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS photos_expiry_idx ON photos(expires_at);
CREATE TABLE IF NOT EXISTS upload_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key,window_start)
);
-- No direct browser DB access. Only the server role connects over the Docker network.
REVOKE ALL ON photos,upload_limits FROM PUBLIC;
