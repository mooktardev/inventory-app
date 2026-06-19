-- Inventory App Database Schema
--
-- Entities:
--   category: groups inventory items (e.g. Electronics, Furniture)
--   item: individual products tracked in inventory
--
-- Relations:
--   category 1 ──< N item
--   Each item MUST belong to exactly one category.
--
-- Delete behavior:
--   ON DELETE RESTRICT on item.category_id — a category with items
--   cannot be deleted. Items must be deleted or reassigned first.

CREATE TABLE IF NOT EXISTS category (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_category_id ON item(category_id);
