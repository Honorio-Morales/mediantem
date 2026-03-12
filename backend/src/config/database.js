/**
 * config/database.js — Crea la conexión a SQLite con better-sqlite3.
 * Si el archivo .db no existe, lo crea automáticamente.
 * Ejecuta el schema SQL para crear las tablas.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { env } = require('./env');

let db;

function getDatabase() {
    if (db) return db;

    const dbPath = path.resolve(env.DB_PATH);
    const dbDir = path.dirname(dbPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    return db;
}

function initDatabase() {
    const database = getDatabase();

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    database.exec(schema);

    console.log('✅ Database initialized at:', path.resolve(env.DB_PATH));
    return database;
}

module.exports = { getDatabase, initDatabase };
