-- Run this in the Supabase SQL editor to set up all tables.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  note TEXT DEFAULT '',
  "isCompany" INTEGER DEFAULT 0,
  ico TEXT DEFAULT '',
  dic TEXT DEFAULT '',
  "billingAddress" TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES clients(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT DEFAULT '',
  "licensePlate" TEXT DEFAULT '',
  color TEXT DEFAULT '',
  note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "orderNumber" INTEGER,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  note TEXT DEFAULT '',
  "clientId" TEXT REFERENCES clients(id),
  "vehicleId" TEXT REFERENCES vehicles(id),
  workers TEXT DEFAULT '[]',
  "durationHours" NUMERIC,
  status TEXT DEFAULT 'open',
  "splitOverride" NUMERIC,
  "createdAt" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payer TEXT NOT NULL,
  category TEXT DEFAULT 'Ostatní',
  note TEXT DEFAULT '',
  "isAuto" INTEGER DEFAULT 0,
  "vatIncluded" INTEGER DEFAULT 1,
  "createdAt" TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_photos (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES orders(id),
  type TEXT NOT NULL,
  filename TEXT DEFAULT '',
  "originalName" TEXT DEFAULT '',
  url TEXT DEFAULT '',
  "createdAt" TEXT DEFAULT ''
);

-- Default settings (safe to re-run)
INSERT INTO settings (key, value) VALUES
  ('partner1', 'Patrik'),
  ('partner2', 'Jirka'),
  ('pausal', '1500'),
  ('split', '50')
ON CONFLICT (key) DO NOTHING;
