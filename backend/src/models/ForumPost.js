/**
 * models/ForumPost.js — Acceso a datos del foro.
 */
const { getDatabase } = require('../config/database');

const ForumPost = {
    findAll({ limit = 10, offset = 0 } = {}) {
        const db = getDatabase();
        return db.prepare(`
      SELECT fp.*, u.name as user_name,
        (SELECT COUNT(*) FROM forum_posts r WHERE r.parent_id = fp.id) as reply_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.parent_id IS NULL
      ORDER BY fp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    },

    findById(id) {
        const db = getDatabase();
        const post = db.prepare(`
      SELECT fp.*, u.name as user_name FROM forum_posts fp JOIN users u ON fp.user_id = u.id WHERE fp.id = ?
    `).get(id);
        if (!post) return null;
        post.replies = this.findReplies(id);
        return post;
    },

    findReplies(parentId) {
        const db = getDatabase();
        return db.prepare(`
      SELECT fp.*, u.name as user_name FROM forum_posts fp JOIN users u ON fp.user_id = u.id WHERE fp.parent_id = ? ORDER BY fp.created_at ASC
    `).all(parentId);
    },

    create({ userId, title, body, parentId = null }) {
        const db = getDatabase();
        const result = db.prepare(
            'INSERT INTO forum_posts (user_id, title, body, parent_id) VALUES (?, ?, ?, ?)'
        ).run(userId, title, body, parentId);
        return db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(result.lastInsertRowid);
    },

    delete(id) {
        const db = getDatabase();
        return db.prepare('DELETE FROM forum_posts WHERE id = ?').run(id);
    },
};

module.exports = ForumPost;
