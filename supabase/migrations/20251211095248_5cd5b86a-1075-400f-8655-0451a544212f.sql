-- Create library_card_applications table
CREATE TABLE public.library_card_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  address_zip TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  card_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.library_card_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_card_applications
CREATE POLICY "Users can insert their own applications"
ON public.library_card_applications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own applications"
ON public.library_card_applications
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all applications"
ON public.library_card_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications"
ON public.library_card_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
ON public.library_card_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT NOT NULL,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations
CREATE POLICY "Anyone can insert donations"
ON public.donations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete donations"
ON public.donations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_library_card_applications_updated_at
BEFORE UPDATE ON public.library_card_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.card_number := 'GCMN-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate card number
CREATE TRIGGER generate_card_number_trigger
BEFORE INSERT ON public.library_card_applications
FOR EACH ROW
EXECUTE FUNCTION public.generate_card_number();