/**
 * middlewares/validate.js — Recibe un schema de Zod como parámetro.
 * Valida req.body contra el schema.
 * Si falla, responde 400 con los errores detallados.
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return res.status(400).json({
                ok: false,
                message: 'Datos de entrada inválidos',
                errors,
            });
        }

        // Replace body with validated & typed data
        req.body = result.data;
        next();
    };
}

module.exports = validate;
