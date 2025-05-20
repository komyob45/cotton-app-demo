-- Таблица для хранения расчетов
CREATE TABLE calculations (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  lce_quotation NUMERIC NOT NULL,
  quotation_date DATE,
  dollar_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для хранения партий
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  calculation_id UUID REFERENCES calculations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  batch_code TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  bales_count INTEGER NOT NULL,
  samples_count INTEGER NOT NULL
);

-- Таблица для хранения проб
CREATE TABLE samples (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  color_grade TEXT NOT NULL,
  leaf_grade INTEGER NOT NULL,
  staple_length INTEGER NOT NULL,
  weight NUMERIC NOT NULL,
  premium_discount NUMERIC NOT NULL,
  lce_quotation NUMERIC NOT NULL,
  sample_price NUMERIC NOT NULL,
  sample_amount NUMERIC NOT NULL
);

-- Индексы для ускорения запросов
CREATE INDEX batches_calculation_id_idx ON batches(calculation_id);
CREATE INDEX samples_batch_id_idx ON samples(batch_id);
