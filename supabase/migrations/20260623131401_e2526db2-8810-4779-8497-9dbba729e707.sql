
-- Add slug + meta fields for SEO course pages
ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC,
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Backfill slug from title for existing rows (lowercase, hyphenate, strip non-alphanum)
UPDATE public.academy_courses
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Ensure uniqueness by appending short id suffix when collisions exist
WITH dupes AS (
  SELECT id, slug,
    row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM public.academy_courses
)
UPDATE public.academy_courses c
SET slug = c.slug || '-' || substr(c.id::text, 1, 6)
FROM dupes d
WHERE c.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS academy_courses_slug_key
  ON public.academy_courses (slug);

-- Trigger to auto-fill slug on insert when missing
CREATE OR REPLACE FUNCTION public.set_academy_course_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := lower(regexp_replace(regexp_replace(coalesce(NEW.title, 'course'), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    IF base = '' THEN base := 'course'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.academy_courses WHERE slug = candidate AND id <> coalesce(NEW.id, gen_random_uuid())) LOOP
      n := n + 1;
      candidate := base || '-' || n::text;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS academy_courses_set_slug ON public.academy_courses;
CREATE TRIGGER academy_courses_set_slug
  BEFORE INSERT OR UPDATE OF title ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_academy_course_slug();

-- Allow anon (public) to read PUBLISHED courses for SEO + public discovery
GRANT SELECT ON public.academy_courses TO anon;
GRANT SELECT ON public.academy_modules TO anon;
GRANT SELECT ON public.academy_lectures TO anon;

DROP POLICY IF EXISTS "Public can view published courses" ON public.academy_courses;
CREATE POLICY "Public can view published courses"
  ON public.academy_courses FOR SELECT
  TO anon
  USING (is_published = true);

DROP POLICY IF EXISTS "Public can view modules of published courses" ON public.academy_modules;
CREATE POLICY "Public can view modules of published courses"
  ON public.academy_modules FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM public.academy_courses c
    WHERE c.id = academy_modules.course_id AND c.is_published = true
  ));

DROP POLICY IF EXISTS "Public can view preview/published lectures" ON public.academy_lectures;
CREATE POLICY "Public can view preview/published lectures"
  ON public.academy_lectures FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1
    FROM public.academy_modules m
    JOIN public.academy_courses c ON c.id = m.course_id
    WHERE m.id = academy_lectures.module_id AND c.is_published = true
  ));
