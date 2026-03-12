/**
 * middlewares/errorHandler.js — Middleware de 4 argumentos (err, req, res, next).
 * Captura errores no manejados, los loguea y responde con código apropiado.
 */
function errorHandler(err, req, res, next) {
    console.error('❌ Error no manejado:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
        ? 'Error interno del servidor'
        : err.message;

    res.status(statusCode).json({
        ok: false,
        message,
    });
}

module.exports = errorHandler;
