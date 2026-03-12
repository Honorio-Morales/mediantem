/**
 * models/Product.js — Acceso a datos de productos.
 */
const { getDatabase } = require('../config/database');

const Product = {
    findAll({ categoryId, limit = 20, offset = 0 } = {}) {
        const db = getDatabase();
        let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) as rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
        const params = [];

        if (categoryId) {
            query += ' WHERE p.category_id = ?';
            params.push(categoryId);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return db.prepare(query).all(...params);
    },

    countAll({ categoryId } = {}) {
        const db = getDatabase();
        let query = 'SELECT COUNT(*) as total FROM products';
        const params = [];

        if (categoryId) {
            query += ' WHERE category_id = ?';
            params.push(categoryId);
        }

        return db.prepare(query).get(...params).total;
    },

    findById(id) {
        const db = getDatabase();
        return db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) as rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
    },

    findWithVariants(id) {
        const db = getDatabase();
        const product = this.findById(id);
        if (!product) return null;

        product.images = db.prepare(
            'SELECT url FROM product_images WHERE product_id = ? ORDER BY position'
        ).all(id).map(i => i.url);

        product.variants = db.prepare(
            'SELECT id, color, color_hex, size, stock FROM product_variants WHERE product_id = ?'
        ).all(id);

        return product;
    },

    findByCategory(categoryId, excludeId, limit = 4) {
        const db = getDatabase();
        return db.prepare(`
      SELECT p.*, 
        (SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id) as rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) as review_count
      FROM products p
      WHERE p.category_id = ? AND p.id != ?
      LIMIT ?
    `).all(categoryId, excludeId, limit);
    },

    create(data) {
        const db = getDatabase();
        const result = db.prepare(
            'INSERT INTO products (name, description, price, original_price, category_id, is_limited) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(data.name, data.description, data.price, data.originalPrice || null, data.categoryId, data.isLimited ? 1 : 0);
        return this.findById(result.lastInsertRowid);
    },

    update(id, data) {
        const db = getDatabase();
        db.prepare(
            'UPDATE products SET name = ?, description = ?, price = ?, original_price = ?, category_id = ?, is_limited = ? WHERE id = ?'
        ).run(data.name, data.description, data.price, data.originalPrice || null, data.categoryId, data.isLimited ? 1 : 0, id);
        return this.findById(id);
    },

    delete(id) {
        const db = getDatabase();
        return db.prepare('DELETE FROM products WHERE id = ?').run(id);
    },
};

module.exports = Product;
