CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  profile jsonb NOT NULL,
  next_check_in timestamptz NOT NULL
);
CREATE TABLE auth_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE TABLE weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  weight double precision NOT NULL CHECK(weight BETWEEN 20 AND 300),
  bmi double precision NOT NULL CHECK(bmi > 0)
);
CREATE INDEX weights_user_time_idx ON weight_entries(user_id,recorded_at);
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  model varchar(100) NOT NULL DEFAULT 'ESP32 + MAX30102',
  key_hash char(64) NOT NULL,
  battery integer NOT NULL DEFAULT 100 CHECK(battery BETWEEN 0 AND 100),
  last_seen timestamptz,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE(id,user_id)
);
CREATE INDEX devices_user_idx ON devices(user_id);
CREATE TABLE measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','invalid','cancelled')),
  source text NOT NULL CHECK(source IN ('simulation','device')),
  scenario text CHECK(scenario IN ('standard','high','oxygen')),
  context text NOT NULL DEFAULT 'unknown' CHECK(context IN ('unknown','resting','exercise')),
  heart_rate double precision CHECK(heart_rate BETWEEN 20 AND 300),
  spo2 double precision CHECK(spo2 BETWEEN 0 AND 100),
  started_at timestamptz NOT NULL DEFAULT now(),
  measured_at timestamptz,
  FOREIGN KEY(device_id,user_id) REFERENCES devices(id,user_id),
  CHECK((source='device' AND device_id IS NOT NULL AND scenario IS NULL) OR (source='simulation' AND device_id IS NULL)),
  CHECK((status='completed' AND heart_rate IS NOT NULL AND spo2 IS NOT NULL AND measured_at IS NOT NULL)
        OR (status<>'completed' AND heart_rate IS NULL AND spo2 IS NULL))
);
CREATE INDEX measurements_user_time_idx ON measurements(user_id,started_at DESC);
CREATE INDEX measurements_device_idx ON measurements(device_id,status);
CREATE TABLE activities (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  data jsonb NOT NULL,
  PRIMARY KEY(user_id,date)
);

CREATE TABLE schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
