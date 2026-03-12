-- ═══════════════════════════════════════════════════════════
-- MEDIANTEM — Schema de Base de Datos
-- Motor: SQLite con better-sqlite3
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'customer',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  description    TEXT    NOT NULL,
  price          REAL    NOT NULL,
  original_price REAL,
  category_id    INTEGER NOT NULL REFERENCES categories(id),
  is_limited     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT    NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color      TEXT    NOT NULL,
  color_hex  TEXT    NOT NULL,
  size       TEXT    NOT NULL,
  stock      INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, color, size)
);

CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id),
  status           TEXT    NOT NULL DEFAULT 'pending',
  subtotal         REAL    NOT NULL,
  shipping_cost    REAL    NOT NULL DEFAULT 0,
  total            REAL    NOT NULL,
  shipping_name    TEXT    NOT NULL,
  shipping_address TEXT    NOT NULL,
  shipping_city    TEXT    NOT NULL,
  shipping_phone   TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id),
  variant_id   INTEGER NOT NULL REFERENCES product_variants(id),
  product_name TEXT    NOT NULL,
  price        REAL    NOT NULL,
  quantity     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  title      TEXT,
  body       TEXT    NOT NULL,
  parent_id  INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  token      TEXT    NOT NULL UNIQUE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
