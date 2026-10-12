-- Optional extra search terms per asset (e.g. 'AtlasClear lawsuit') used by the
-- /portfolio/news feed on top of the asset name
ALTER TABLE public.data ADD COLUMN IF NOT EXISTS news_keywords text;
