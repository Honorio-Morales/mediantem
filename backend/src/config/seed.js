/**
 * config/seed.js — Datos de prueba para desarrollo.
 * 4 categorías + 10 productos con variantes e imágenes.
 * Ejecutar: node src/config/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initDatabase, getDatabase } = require('./database');

function seed() {
    const db = initDatabase();

    // Check if already seeded
    const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
    if (count.c > 0) {
        console.log('⚠️  Database already has data. Skipping seed.');
        return;
    }

    console.log('🌱 Seeding database...');

    // ─── Categories ───────────────────────────────────────────
    const insertCategory = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
    const categories = [
        ['Casual', 'casual'],
        ['Dress', 'dress'],
        ['Athletic', 'athletic'],
        ['Kids', 'kids'],
    ];
    categories.forEach(([name, slug]) => insertCategory.run(name, slug));
    console.log('   ✓ 4 categories');

    // ─── Products ─────────────────────────────────────────────
    const insertProduct = db.prepare(
        'INSERT INTO products (name, description, price, original_price, category_id, is_limited) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertImage = db.prepare(
        'INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)'
    );
    const insertVariant = db.prepare(
        'INSERT INTO product_variants (product_id, color, color_hex, size, stock) VALUES (?, ?, ?, ?, ?)'
    );

    const products = [
        { name: 'Premium Soft Socks', desc: 'Experience luxury with our premium socks, designed for ultimate comfort. Made with extra-soft cotton blend.', price: 19.99, original: 24.99, cat: 1, limited: 0 },
        { name: 'Stylish and Cozy', desc: 'The perfect blend of style and warmth. These socks feature a modern design with cozy inner lining.', price: 22.00, original: null, cat: 1, limited: 1 },
        { name: 'Premium Merino Socks', desc: 'Crafted from premium Merino wool for exceptional softness and temperature regulation.', price: 19.99, original: null, cat: 2, limited: 0 },
        { name: 'Ultra-Soft Cotton Socks', desc: 'Ultra-soft Egyptian cotton socks with reinforced toe and heel for durability.', price: 15.00, original: null, cat: 1, limited: 0 },
        { name: 'Breathable Sports Socks', desc: 'Engineered for athletes with moisture-wicking technology and arch support.', price: 17.50, original: null, cat: 3, limited: 0 },
        { name: 'Colorful Patterned Socks', desc: 'Express yourself with our vibrant patterned designs. Perfect for adding flair to any outfit.', price: 22.00, original: null, cat: 1, limited: 0 },
        { name: 'Luxury Dress Socks', desc: 'Elegant dress socks in premium materials. Perfect for formal occasions and business attire.', price: 24.99, original: null, cat: 2, limited: 0 },
        { name: 'Gift Set of Socks', desc: 'A curated set of 3 premium socks in a beautiful gift box. The perfect present.', price: 49.99, original: null, cat: 1, limited: 0 },
        { name: 'Thermal Winter Socks', desc: 'Stay warm with our thermal socks featuring advanced heat-retention technology.', price: 29.99, original: null, cat: 3, limited: 0 },
        { name: 'Compression Socks', desc: 'Medical-grade compression socks for improved circulation and reduced fatigue.', price: 18.00, original: null, cat: 3, limited: 0 },
    ];

    const colors = [
        { name: 'Deep Black', hex: '#1A1A2E' },
        { name: 'Navy', hex: '#16213E' },
        { name: 'Red', hex: '#E94560' },
    ];
    const sizes = ['S', 'M', 'L', 'XL'];

    const seedTransaction = db.transaction(() => {
        products.forEach((p, idx) => {
            const result = insertProduct.run(p.name, p.desc, p.price, p.original, p.cat, p.limited);
            const productId = result.lastInsertRowid;

            // Add placeholder image
            insertImage.run(productId, `https://via.placeholder.com/400x400/16213E/E94560?text=Sock+${idx + 1}`, 0);
            insertImage.run(productId, `https://via.placeholder.com/400x400/1A1A2E/FFFFFF?text=Detail+${idx + 1}`, 1);

            // Add variants (all color+size combos)
            colors.forEach((color) => {
                sizes.forEach((size) => {
                    const stock = Math.floor(Math.random() * 20) + 5; // 5-24
                    insertVariant.run(productId, color.name, color.hex, size, stock);
                });
            });
        });
    });

    seedTransaction();
    console.log('   ✓ 10 products with variants & images');

    // ─── Admin user ───────────────────────────────────────────
    const bcrypt = require('bcrypt');
    const hash = bcrypt.hashSync('admin1234', 12);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
        'Admin',
        'admin@mediantem.com',
        hash,
        'admin'
    );
    console.log('   ✓ Admin user (admin@mediantem.com / admin1234)');

    console.log('🌱 Seed complete!');
}

seed();
