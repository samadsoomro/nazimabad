-- Create book_borrows table
CREATE TABLE public.book_borrows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  book_title TEXT NOT NULL,
  borrow_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  return_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on book_borrows
ALTER TABLE public.book_borrows ENABLE ROW LEVEL SECURITY;

-- Users can view their own borrows
CREATE POLICY "Users can view their own borrows"
ON public.book_borrows
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own borrows
CREATE POLICY "Users can insert their own borrows"
ON public.book_borrows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all borrows
CREATE POLICY "Admins can view all borrows"
ON public.book_borrows
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update borrows
CREATE POLICY "Admins can update borrows"
ON public.book_borrows
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete borrows
CREATE POLICY "Admins can delete borrows"
ON public.book_borrows
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for book_borrows
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_borrows;