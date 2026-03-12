/**
 * utils/response.js — Helpers para construir respuestas JSON estandarizadas.
 */

function success(res, data, code = 200) {
    return res.status(code).json({ ok: true, data });
}

function error(res, message, code = 400) {
    return res.status(code).json({ ok: false, message });
}

function paginated(res, data, total, page, limit) {
    return res.status(200).json({
        ok: true,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}

module.exports = { success, error, paginated };
