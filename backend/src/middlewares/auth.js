/**
 * middlewares/auth.js — Verifica JWT en header Authorization: Bearer <token>.
 * Si es válido, agrega req.user = { id, email, role } y llama next().
 * Si es inválido o expirado, responde 401.
 */
const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

function auth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, 'No autorizado — token faltante', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch (err) {
        return error(res, 'No autorizado — token inválido o expirado', 401);
    }
}

module.exports = auth;
