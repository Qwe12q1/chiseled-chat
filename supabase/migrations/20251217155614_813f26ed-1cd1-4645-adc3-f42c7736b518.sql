-- Update handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, phone, name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$function$;