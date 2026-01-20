-- Añadir campo access_expires_at a invitations para almacenar la fecha de expiración del acceso
ALTER TABLE public.invitations 
ADD COLUMN access_expires_at timestamp with time zone DEFAULT NULL;

-- Comentario para documentar
COMMENT ON COLUMN public.invitations.access_expires_at IS 'Fecha de expiración del acceso del usuario invitado';

-- Actualizar la función handle_new_user_role para asignar automáticamente la expiración
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  inv_expires_at timestamp with time zone;
BEGIN
  -- Check if user was invited
  IF EXISTS (SELECT 1 FROM public.invitations WHERE email = lower(NEW.email) AND is_active = true) THEN
    -- Get the expiration from invitation
    SELECT access_expires_at INTO inv_expires_at 
    FROM public.invitations 
    WHERE email = lower(NEW.email) AND is_active = true
    LIMIT 1;
    
    -- Create user role with expiration from invitation
    INSERT INTO public.user_roles (user_id, role, expires_at)
    VALUES (NEW.id, 'user', inv_expires_at);
    
    -- Mark invitation as accepted
    UPDATE public.invitations 
    SET is_accepted = true, accepted_at = now()
    WHERE email = lower(NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$;