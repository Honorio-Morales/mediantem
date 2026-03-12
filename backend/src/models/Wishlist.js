/**
 * models/Wishlist.js — Acceso a datos de la wishlist.
 */
const { getDatabase } = require('../config/database');

const Wishlist = {
    findByUser(userId) {
        const db = getDatabase();
        return db.prepare(`
      SELECT w.product_id, p.name, p.price, p.original_price,
        (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position LIMIT 1) as image
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `).all(userId);
    },

    add(userId, productId) {
        const db = getDatabase();
        return db.prepare('INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)').run(userId, productId);
    },

    remove(userId, productId) {
        const db = getDatabase();
        return db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(userId, productId);
    },
};

module.exports = Wishlist;
