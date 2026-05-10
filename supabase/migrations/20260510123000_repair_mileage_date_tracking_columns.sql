ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS mileage_as_of_date date,
  ADD COLUMN IF NOT EXISTS mileage_check_interval_days integer NOT NULL DEFAULT 14;

UPDATE public.cars c
SET mileage_as_of_date = COALESCE(
  c.mileage_as_of_date,
  (SELECT MAX(e.date) FROM public.entries e WHERE e.car_id = c.id),
  c.created_at::date
)
WHERE c.mileage_as_of_date IS NULL;

ALTER TABLE public.cars
  ALTER COLUMN mileage_as_of_date SET NOT NULL,
  ALTER COLUMN mileage_as_of_date SET DEFAULT CURRENT_DATE;
