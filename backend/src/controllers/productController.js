/**
 * controllers/productController.js — Lógica de negocio de productos.
 */
const Product = require('../models/Product');
const { getDatabase } = require('../config/database');
const { success, error, paginated } = require('../utils/response');

const productController = {
    getAll(req, res, next) {
        try {
            const { category, limit = 20, page = 1 } = req.query;
            const limitNum = parseInt(limit);
            const pageNum = parseInt(page);
            const offset = (pageNum - 1) * limitNum;

            let categoryId;
            if (category) {
                const db = getDatabase();
                const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(category);
                if (!cat) return error(res, 'Categoría no encontrada', 404);
                categoryId = cat.id;
            }

            const products = Product.findAll({ categoryId, limit: limitNum, offset });
            const total = Product.countAll({ categoryId });

            // Add images to each product
            const db = getDatabase();
            const productsWithImages = products.map(p => ({
                ...p,
                images: db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position').all(p.id).map(i => i.url),
                isLimited: !!p.is_limited,
                originalPrice: p.original_price,
                categoryId: p.category_id,
                reviewCount: p.review_count || 0,
                rating: p.rating ? parseFloat(p.rating.toFixed(1)) : 0,
            }));

            return paginated(res, productsWithImages, total, pageNum, limitNum);
        } catch (err) {
            next(err);
        }
    },

    getById(req, res, next) {
        try {
            const product = Product.findWithVariants(parseInt(req.params.id));
            if (!product) return error(res, 'Producto no encontrado', 404);

            return success(res, {
                ...product,
                isLimited: !!product.is_limited,
                originalPrice: product.original_price,
                categoryId: product.category_id,
                reviewCount: product.review_count || 0,
                rating: product.rating ? parseFloat(product.rating.toFixed(1)) : 0,
            });
        } catch (err) {
            next(err);
        }
    },

    getRelated(req, res, next) {
        try {
            const product = Product.findById(parseInt(req.params.id));
            if (!product) return error(res, 'Producto no encontrado', 404);

            const related = Product.findByCategory(product.category_id, product.id);
            return success(res, related);
        } catch (err) {
            next(err);
        }
    },

    create(req, res, next) {
        try {
            const product = Product.create(req.body);
            return success(res, product, 201);
        } catch (err) {
            next(err);
        }
    },

    update(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const existing = Product.findById(id);
            if (!existing) return error(res, 'Producto no encontrado', 404);

            const product = Product.update(id, req.body);
            return success(res, product);
        } catch (err) {
            next(err);
        }
    },

    delete(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const existing = Product.findById(id);
            if (!existing) return error(res, 'Producto no encontrado', 404);

            Product.delete(id);
            return success(res, { message: 'Producto eliminado' });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = productController;
