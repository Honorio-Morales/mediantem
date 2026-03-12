/**
 * models/Order.js — Acceso a datos de pedidos.
 */
const { getDatabase } = require('../config/database');

const Order = {
    create({ userId, items, subtotal, shippingCost, total, shipping }) {
        const db = getDatabase();
        const createOrder = db.transaction(() => {
            const result = db.prepare(`
        INSERT INTO orders (user_id, subtotal, shipping_cost, total, shipping_name, shipping_address, shipping_city, shipping_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, subtotal, shippingCost, total, shipping.name, shipping.address, shipping.city, shipping.phone);

            const orderId = result.lastInsertRowid;

            const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

            const decrementStock = db.prepare(`
        UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?
      `);

            for (const item of items) {
                insertItem.run(orderId, item.productId, item.variantId, item.productName, item.price, item.quantity);
                const stockResult = decrementStock.run(item.quantity, item.variantId, item.quantity);
                if (stockResult.changes === 0) {
                    throw new Error(`Stock insuficiente para variante ${item.variantId}`);
                }
            }

            return orderId;
        });

        return createOrder();
    },

    findById(id) {
        const db = getDatabase();
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) return null;
        order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        return order;
    },

    findByUser(userId) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    },

    findAll({ status, limit = 20, offset = 0 } = {}) {
        const db = getDatabase();
        let query = 'SELECT * FROM orders';
        const params = [];
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        return db.prepare(query).all(...params);
    },

    updateStatus(id, status) {
        const db = getDatabase();
        return db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    },
};

module.exports = Order;
