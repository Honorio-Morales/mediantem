/**
 * middlewares/isAdmin.js — Verifica req.user.role === 'admin'.
 * Debe usarse DESPUÉS de auth.js.
 */
const { error } = require('../utils/response');

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return error(res, 'Acceso denegado — se requiere rol de administrador', 403);
    }
    next();
}

module.exports = isAdmin;
