/**
 * config/env.js — Lee y valida variables de entorno requeridas.
 * Si falta alguna requerida, lanza error descriptivo y termina el proceso.
 */
const requiredVars = [
    'PORT',
    'DB_PATH',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
];

const optionalVars = [
    'NODE_ENV',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'CULQI_PUBLIC_KEY',
    'CULQI_SECRET_KEY',
];

const env = {
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_PATH: process.env.DB_PATH || './database/mediantem.db',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4321',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@mediantem.com',
    CULQI_PUBLIC_KEY: process.env.CULQI_PUBLIC_KEY,
    CULQI_SECRET_KEY: process.env.CULQI_SECRET_KEY,
};

function validateEnv() {
    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error('❌ Variables de entorno faltantes:');
        missing.forEach((key) => console.error(`   - ${key}`));
        console.error('\nCrea un archivo .env en backend/ con las variables requeridas.');
        process.exit(1);
    }
}

// Only validate in non-test environments
if (process.env.NODE_ENV !== 'test') {
    validateEnv();
}

module.exports = { env, validateEnv };
