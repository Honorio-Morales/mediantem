/**
 * models/Review.js — Acceso a datos de reseñas.
 */
const { getDatabase } = require('../config/database');

const Review = {
    findByProduct(productId, { rating, limit = 10, offset = 0 } = {}) {
        const db = getDatabase();
        let query = `
      SELECT r.*, u.name as user_name 
      FROM reviews r JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
    `;
        const params = [productId];
        if (rating) { query += ' AND r.rating = ?'; params.push(rating); }
        query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        return db.prepare(query).all(...params);
    },

    getAggregated(productId) {
        const db = getDatabase();
        const summary = db.prepare(`
      SELECT AVG(rating) as average, COUNT(*) as total FROM reviews WHERE product_id = ?
    `).get(productId);
        const distribution = db.prepare(`
      SELECT rating, COUNT(*) as count FROM reviews WHERE product_id = ? GROUP BY rating
    `).all(productId);
        return { ...summary, distribution };
    },

    create({ userId, productId, rating, title, body }) {
        const db = getDatabase();
        const result = db.prepare(
            'INSERT INTO reviews (user_id, product_id, rating, title, body) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, productId, rating, title, body);
        return db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    },
};

module.exports = Review;
