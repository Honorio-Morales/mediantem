/**
 * controllers/statsController.js — Estadísticas del panel admin.
 */
const { getDatabase } = require('../config/database');
const { success } = require('../utils/response');

const statsController = {
    getOverview(req, res, next) {
        try {
            const db = getDatabase();
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const totalSales = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE created_at >= ? AND status != 'cancelled'").get(monthStart);
            const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get();
            const lowStock = db.prepare('SELECT COUNT(DISTINCT product_id) as count FROM product_variants WHERE stock < 5').get();
            const newUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(monthStart);

            return success(res, {
                monthlySales: totalSales.total,
                pendingOrders: pendingOrders.count,
                lowStockProducts: lowStock.count,
                newUsers: newUsers.count,
            });
        } catch (err) { next(err); }
    },

    getSales(req, res, next) {
        try {
            const db = getDatabase();
            const { period = 'week' } = req.query;
            let days = period === 'year' ? 365 : period === 'month' ? 30 : 7;
            const since = new Date(Date.now() - days * 86400000).toISOString();

            const sales = db.prepare(`
        SELECT DATE(created_at) as date, SUM(total) as total, COUNT(*) as orders
        FROM orders WHERE created_at >= ? AND status != 'cancelled'
        GROUP BY DATE(created_at) ORDER BY date
      `).all(since);

            return success(res, sales);
        } catch (err) { next(err); }
    },

    getTopProducts(req, res, next) {
        try {
            const db = getDatabase();
            const top = db.prepare(`
        SELECT oi.product_name as name, SUM(oi.quantity) as units, SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY oi.product_name
        ORDER BY units DESC LIMIT 5
      `).all();

            return success(res, top);
        } catch (err) { next(err); }
    },
};

module.exports = statsController;
