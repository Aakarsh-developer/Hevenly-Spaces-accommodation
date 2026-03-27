
-- Fix overly permissive notifications insert policy
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() IS NOT NULL);
