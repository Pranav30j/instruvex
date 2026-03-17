
-- Create internship certificates table
CREATE TABLE public.internship_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  candidate_name text NOT NULL,
  role text NOT NULL,
  organization text NOT NULL DEFAULT 'Instruvex',
  start_date date NOT NULL,
  end_date date NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'verified',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internship_certificates ENABLE ROW LEVEL SECURITY;

-- Public can verify (read) certificates
CREATE POLICY "Anyone can verify internship certificates"
  ON public.internship_certificates FOR SELECT
  TO public
  USING (true);

-- Super admins and instructors can manage
CREATE POLICY "Super admins manage internship certificates"
  ON public.internship_certificates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Creators manage own internship certificates"
  ON public.internship_certificates FOR ALL
  TO authenticated
  USING (auth.uid() = created_by);

-- Auto-generate certificate ID sequence
CREATE SEQUENCE IF NOT EXISTS internship_cert_seq START 1;

-- Function to generate certificate ID
CREATE OR REPLACE FUNCTION public.generate_internship_cert_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  seq_val integer;
BEGIN
  IF NEW.certificate_id IS NULL OR NEW.certificate_id = '' THEN
    seq_val := nextval('internship_cert_seq');
    NEW.certificate_id := 'INS-INT-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-' || LPAD(seq_val::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_internship_cert_id
  BEFORE INSERT ON public.internship_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_internship_cert_id();

-- Updated at trigger
CREATE TRIGGER update_internship_certificates_updated_at
  BEFORE UPDATE ON public.internship_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
