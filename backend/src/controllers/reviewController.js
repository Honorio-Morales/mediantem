/**
 * controllers/reviewController.js
 */
const Review = require('../models/Review');
const { success, error } = require('../utils/response');

const reviewController = {
    getByProduct(req, res, next) {
        try {
            const { rating, limit = 10, page = 1 } = req.query;
            const reviews = Review.findByProduct(parseInt(req.params.productId), {
                rating: rating ? parseInt(rating) : undefined,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
            });
            return success(res, reviews);
        } catch (err) { next(err); }
    },

    getSummary(req, res, next) {
        try {
            const summary = Review.getAggregated(parseInt(req.params.productId));
            return success(res, summary);
        } catch (err) { next(err); }
    },

    create(req, res, next) {
        try {
            const review = Review.create({ userId: req.user.id, ...req.body });
            return success(res, review, 201);
        } catch (err) {
            if (err.message?.includes('UNIQUE')) return error(res, 'Ya dejaste una reseña para este producto', 409);
            next(err);
        }
    },
};

module.exports = reviewController;
