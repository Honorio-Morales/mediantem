/**
 * services/emailService.js — Envío de emails transaccionales con Resend.
 * TODO: Implementar con Resend API en Stage 3
 */
const { env } = require('../config/env');

const emailService = {
    async sendOrderConfirmation(to, order) {
        if (env.NODE_ENV === 'development') {
            console.log(`📧 [DEV] Email de confirmación enviado a: ${to}`);
            console.log(`   Pedido #${order.id} — Total: S/. ${order.total}`);
            return;
        }
        // TODO: Implement with Resend
    },

    async sendPasswordReset(to, token) {
        if (env.NODE_ENV === 'development') {
            console.log(`📧 [DEV] Email de reset enviado a: ${to}`);
            console.log(`   Token: ${token}`);
            return;
        }
        // TODO: Implement with Resend
    },
};

module.exports = emailService;
