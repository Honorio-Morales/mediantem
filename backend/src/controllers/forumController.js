/**
 * controllers/forumController.js
 */
const ForumPost = require('../models/ForumPost');
const { success, error } = require('../utils/response');

const forumController = {
    getAll(req, res, next) {
        try {
            const { limit = 10, page = 1 } = req.query;
            const posts = ForumPost.findAll({ limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit) });
            return success(res, posts);
        } catch (err) { next(err); }
    },

    getById(req, res, next) {
        try {
            const post = ForumPost.findById(parseInt(req.params.id));
            if (!post) return error(res, 'Hilo no encontrado', 404);
            return success(res, post);
        } catch (err) { next(err); }
    },

    create(req, res, next) {
        try {
            const post = ForumPost.create({ userId: req.user.id, title: req.body.title, body: req.body.body });
            return success(res, post, 201);
        } catch (err) { next(err); }
    },

    reply(req, res, next) {
        try {
            const parent = ForumPost.findById(parseInt(req.params.id));
            if (!parent) return error(res, 'Hilo no encontrado', 404);
            const reply = ForumPost.create({ userId: req.user.id, title: null, body: req.body.body, parentId: parent.id });
            return success(res, reply, 201);
        } catch (err) { next(err); }
    },

    delete(req, res, next) {
        try {
            const post = ForumPost.findById(parseInt(req.params.id));
            if (!post) return error(res, 'Mensaje no encontrado', 404);
            if (post.user_id !== req.user.id && req.user.role !== 'admin') return error(res, 'No autorizado', 403);
            ForumPost.delete(post.id);
            return success(res, { message: 'Eliminado' });
        } catch (err) { next(err); }
    },
};

module.exports = forumController;
