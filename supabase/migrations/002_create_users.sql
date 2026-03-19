CREATE TABLE IF NOT EXISTS users (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  username text UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 1 and 30),

  created_at timestamptz NOT NULL DEFAULT now(),

  deactivated_at timestamptz DEFAULT NULL

);