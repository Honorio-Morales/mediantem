/**
 * controllers/orderController.js — Lógica de negocio de pedidos.
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { success, error } = require('../utils/response');

const orderController = {
    create(req, res, next) {
        try {
            const { items, shipping } = req.body;
            const userId = req.user.id;

            // Verify stock and calculate prices
            let subtotal = 0;
            const orderItems = [];
            for (const item of items) {
                const variant = ProductVariant.findById(item.variantId);
                if (!variant) return error(res, `Variante ${item.variantId} no encontrada`, 400);
                if (variant.stock < item.quantity) return error(res, `Stock insuficiente para variante ${item.variantId}`, 400);

                const product = Product.findById(variant.product_id);
                subtotal += product.price * item.quantity;
                orderItems.push({
                    productId: product.id,
                    variantId: variant.id,
                    productName: product.name,
                    price: product.price,
                    quantity: item.quantity,
                });
            }

            const shippingCost = 0; // Free shipping for now
            const total = subtotal + shippingCost;

            const orderId = Order.create({ userId, items: orderItems, subtotal, shippingCost, total, shipping });
            const order = Order.findById(orderId);

            return success(res, order, 201);
        } catch (err) {
            next(err);
        }
    },

    getMyOrders(req, res, next) {
        try {
            const orders = Order.findByUser(req.user.id);
            return success(res, orders);
        } catch (err) {
            next(err);
        }
    },

    getById(req, res, next) {
        try {
            const order = Order.findById(parseInt(req.params.id));
            if (!order) return error(res, 'Pedido no encontrado', 404);
            if (order.user_id !== req.user.id && req.user.role !== 'admin') return error(res, 'No autorizado', 403);
            return success(res, order);
        } catch (err) {
            next(err);
        }
    },

    getAll(req, res, next) {
        try {
            const { status, limit = 20, page = 1 } = req.query;
            const orders = Order.findAll({ status, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) });
            return success(res, orders);
        } catch (err) {
            next(err);
        }
    },

    updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            Order.updateStatus(parseInt(req.params.id), status);
            return success(res, { message: 'Estado actualizado' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = orderController;
