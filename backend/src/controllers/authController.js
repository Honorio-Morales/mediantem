/**
 * controllers/authController.js — Lógica de negocio de autenticación.
 */
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { getDatabase } = require('../config/database');
const { env } = require('../config/env');

const SALT_ROUNDS = 12;

const authController = {
    async register(req, res, next) {
        try {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existing = User.findByEmail(email);
            if (existing) return error(res, 'El email ya está registrado', 409);

            // Hash password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Create user
            const user = User.create({ name, email, passwordHash });

            // Generate tokens
            const payload = { id: user.id, email: user.email, role: user.role };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            // Save refresh token
            const db = getDatabase();
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, refreshToken, expiresAt);

            // Set HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/auth',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            });

            return success(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken }, 201);
        } catch (err) {
            next(err);
        }
    },

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const user = User.findByEmail(email);
            if (!user) return error(res, 'Credenciales incorrectas', 401);

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) return error(res, 'Credenciales incorrectas', 401);

            const payload = { id: user.id, email: user.email, role: user.role };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            // Delete old refresh tokens for this user
            const db = getDatabase();
            db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(user.id);

            // Save new refresh token
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, refreshToken, expiresAt);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/auth',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return success(res, {
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                accessToken,
            });
        } catch (err) {
            next(err);
        }
    },

    logout(req, res, next) {
        try {
            const token = req.cookies?.refreshToken;
            if (token) {
                const db = getDatabase();
                db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
            }

            res.clearCookie('refreshToken', { path: '/api/auth' });
            return success(res, { message: 'ok' });
        } catch (err) {
            next(err);
        }
    },

    refreshToken(req, res, next) {
        try {
            const token = req.cookies?.refreshToken;
            if (!token) return error(res, 'No refresh token', 401);

            // Verify token
            let payload;
            try {
                payload = verifyRefreshToken(token);
            } catch {
                return error(res, 'Refresh token inválido', 401);
            }

            // Check token exists in DB
            const db = getDatabase();
            const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
            if (!stored) return error(res, 'Refresh token no encontrado', 401);

            // Check expiration
            if (new Date(stored.expires_at) < new Date()) {
                db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
                return error(res, 'Refresh token expirado', 401);
            }

            // Generate new tokens (rotation)
            const newAccessToken = generateAccessToken({ id: payload.id, email: payload.email, role: payload.role });
            const newRefreshToken = generateRefreshToken({ id: payload.id, email: payload.email, role: payload.role });

            // Rotate refresh token
            db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
            const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(payload.id, newRefreshToken, newExpiresAt);

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/api/auth',
                maxAge: 30 * 24 * 60 * 60 * 1000,
            });

            return success(res, { accessToken: newAccessToken });
        } catch (err) {
            next(err);
        }
    },
};

module.exports = authController;
