const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// fetch all messages in a chat
router.get('/:user1Id/:user2Id/messages', async (req, res) => {
    const { user1Id, user2Id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2)
                                       OR (sender_id = $2 AND receiver_id = $1)
                                    ORDER BY created_at ASC`,
            [user1Id, user2Id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.messages });
    }
})

// create new message in chat
router.post('/:sender_id/:receiver_id/messages', async (req, res) => {
    const { sender_id, receiver_id } = req.params;
    const { content } = req.body;
    if (!sender_id || !receiver_id || !content) {
        res.status(400).json({ error: "Missing required fields" });
    }
    
    const timestamp = new Date().toISOString();
    const is_read = false;

    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, content, created_at, is_read) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sender_id, receiver_id, content, timestamp, is_read]
        );
        res.status(201).json({
            message: "Comment created successfully",
            content: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// update messages (for is_read)
router.put('/:sender_id/:receiver_id/messages', async (req, res) => {
    const { sender_id, receiver_id } = req.params;
    const { isRead } = req.body;

    try {
        const result = await pool.query(
            'UPDATE messages SET is_read = $1 WHERE sender_id = $2 AND receiver_id = $3 RETURNING *',
            [isRead, sender_id, receiver_id]
        );
        if (result.rows.length == 0) {
            return res.status(404).json({ error: "Message not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

module.exports = router;