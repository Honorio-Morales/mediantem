/**
 * utils/jwt.js — Generación y verificación de tokens JWT.
 */
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
