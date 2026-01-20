-- Agregar columna de expiración a user_roles para acceso temporal
ALTER TABLE public.user_roles 
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;

-- Crear función para verificar si el usuario tiene acceso activo (no expirado)
CREATE OR REPLACE FUNCTION public.is_user_access_valid(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Comentario explicativo
COMMENT ON COLUMN public.user_roles.expires_at IS 'Fecha de expiración del acceso. NULL significa acceso permanente.';