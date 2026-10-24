CREATE TABLE IF NOT EXISTS profiles (

  id uuid PRIMARY KEY REFERENCES auth.users (id),

  username text UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 1 and 30),

  created_at timestamptz NOT NULL DEFAULT now(),

  deactivated_at timestamptz DEFAULT NULL

);

-- Users get an automatically assigned username on signup of 
-- 'user_' + 6 char string from their uuid
-- This builds that username, checks for conflicts with other profiles,
-- and then slides one alphanumeric char to the right if a conflict is found.
CREATE OR REPLACE FUNCTION create_new_user_profile()
    RETURNS trigger AS $$
    DECLARE
      hex text := replace(NEW.id::text, '-', '');
    BEGIN
      -- try each 6-character window: chars 1-6, then 2-7, then 3-8, ...
      FOR i IN 1..27 LOOP
        INSERT INTO public.profiles (id, username)
          VALUES (NEW.id, 'user_' || substring(hex from i for 6))
          ON CONFLICT (username) DO NOTHING;

        IF FOUND THEN
          RETURN NEW;
        END IF;
      END LOOP;

      RAISE EXCEPTION 'could not generate a unique username';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_new_user_profile();