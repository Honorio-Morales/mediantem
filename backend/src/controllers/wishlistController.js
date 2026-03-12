/**
 * controllers/wishlistController.js
 */
const Wishlist = require('../models/Wishlist');
const { success } = require('../utils/response');

const wishlistController = {
    get(req, res, next) {
        try {
            const items = Wishlist.findByUser(req.user.id);
            return success(res, items);
        } catch (err) { next(err); }
    },

    add(req, res, next) {
        try {
            Wishlist.add(req.user.id, req.body.productId);
            return success(res, { message: 'Agregado a wishlist' }, 201);
        } catch (err) { next(err); }
    },

    remove(req, res, next) {
        try {
            Wishlist.remove(req.user.id, parseInt(req.params.productId));
            return success(res, { message: 'Eliminado de wishlist' });
        } catch (err) { next(err); }
    },
};

module.exports = wishlistController;
