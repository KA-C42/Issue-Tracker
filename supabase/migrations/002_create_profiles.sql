CREATE TABLE IF NOT EXISTS profiles (

  id uuid PRIMARY KEY REFERENCES auth.users (id),

  username text UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 1 and 30),

  email text UNIQUE NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  deactivated_at timestamptz DEFAULT NULL

);

CREATE OR REPLACE FUNCTION create_new_user_profile()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, username, email)
        VALUES (NEW.id, 'user_' || substring(NEW.id::text from 1 for 6), NEW.email)
        ON CONFLICT (username) DO UPDATE SET username = 'user_' || substring(NEW.id::text from 1 for 8 );
    RETURN new;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_new_user_profile();