-- Add new columns to library_card_applications
ALTER TABLE public.library_card_applications
ADD COLUMN IF NOT EXISTS father_name text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS field text,
ADD COLUMN IF NOT EXISTS student_id text,
ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS valid_through date DEFAULT (CURRENT_DATE + interval '1 year');

-- Create function to generate card_id based on field code, roll number, and class code
CREATE OR REPLACE FUNCTION public.generate_library_card_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  field_code text;
  class_code text;
  roll_no_clean text;
BEGIN
  -- Get field code
  CASE NEW.field
    WHEN 'Computer Science' THEN field_code := 'CS';
    WHEN 'Pre-Medical' THEN field_code := 'PM';
    WHEN 'Pre-Engineering' THEN field_code := 'PE';
    WHEN 'Humanities' THEN field_code := 'HU';
    WHEN 'Commerce' THEN field_code := 'CO';
    ELSE field_code := 'XX';
  END CASE;
  
  -- Get class code
  CASE NEW.class
    WHEN 'Class 11' THEN class_code := '11';
    WHEN 'Class 12' THEN class_code := '12';
    WHEN 'ADA I' THEN class_code := 'AI';
    WHEN 'ADA II' THEN class_code := 'AII';
    WHEN 'BSC I' THEN class_code := 'BI';
    WHEN 'BSC II' THEN class_code := 'BII';
    ELSE class_code := 'XX';
  END CASE;
  
  -- Clean roll number (remove any prefix like E-)
  roll_no_clean := regexp_replace(NEW.roll_no, '^[A-Za-z]-?', '');
  
  -- Generate card_id in format: {FieldCode}-{RollNo}-{ClassCode}
  NEW.card_number := field_code || '-' || roll_no_clean || '-' || class_code;
  
  -- Generate student_id
  NEW.student_id := 'GCMN-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Set issue date and valid through
  NEW.issue_date := CURRENT_DATE;
  NEW.valid_through := CURRENT_DATE + interval '1 year';
  
  RETURN NEW;
END;
$$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS generate_card_number_trigger ON public.library_card_applications;

-- Create new trigger
CREATE TRIGGER generate_library_card_id_trigger
BEFORE INSERT ON public.library_card_applications
FOR EACH ROW
EXECUTE FUNCTION public.generate_library_card_id();

-- Create students table for registered students
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id text NOT NULL UNIQUE,
  name text NOT NULL,
  class text,
  field text,
  roll_no text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own student record" ON public.students
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student record" ON public.students
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all students" ON public.students
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage students" ON public.students
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create non_students table for staff/visitors
CREATE TABLE IF NOT EXISTS public.non_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.non_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own non_student record" ON public.non_students
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own non_student record" ON public.non_students
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all non_students" ON public.non_students
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage non_students" ON public.non_students
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));