/**
 * models/ProductVariant.js — Acceso a datos de variantes de producto.
 */
const { getDatabase } = require('../config/database');

const ProductVariant = {
    findByProduct(productId) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(productId);
    },

    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM product_variants WHERE id = ?').get(id);
    },

    updateStock(variantId, newStock) {
        const db = getDatabase();
        return db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?').run(newStock, variantId);
    },

    decrementStock(variantId, quantity) {
        const db = getDatabase();
        return db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?').run(quantity, variantId, quantity);
    },
};

module.exports = ProductVariant;
