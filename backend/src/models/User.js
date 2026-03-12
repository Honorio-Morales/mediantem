/**
 * models/User.js — Acceso a datos de la tabla users.
 */
const { getDatabase } = require('../config/database');

const User = {
    findById(id) {
        const db = getDatabase();
        return db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
    },

    findByEmail(email) {
        const db = getDatabase();
        return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },

    create({ name, email, passwordHash, role = 'customer' }) {
        const db = getDatabase();
        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        ).run(name, email, passwordHash, role);
        return this.findById(result.lastInsertRowid);
    },

    updatePassword(id, newHash) {
        const db = getDatabase();
        return db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id);
    },
};

module.exports = User;
