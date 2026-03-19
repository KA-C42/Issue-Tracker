CREATE OR REPLACE FUNCTION update_modified_at() 
    RETURNS TRIGGER AS $$
    BEGIN
        new.modified_at := now();
    RETURN new;
    end;
$$ LANGUAGE plpgsql SET search_path = public;