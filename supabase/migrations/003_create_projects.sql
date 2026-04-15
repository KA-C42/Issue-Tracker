CREATE TABLE IF NOT EXISTS projects (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id uuid REFERENCES users (id) ON DELETE CASCADE NOT NULL, 

  name text NOT NULL CHECK (char_length(name) BETWEEN 1 and 64),

  description text,

  code text NOT NULL CHECK(code ~* '^[a-z0-9]{1,4}$'),

  issue_counter smallint NOT NULL DEFAULT 0,

  modified_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (owner_id, name)

);

CREATE OR REPLACE TRIGGER project_modified 
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_modified_at();

