const express = require('express');
const router = express.Router();
const pool = require('../db.js');

// fetch all messages in a chat
router.get('/:roomId/', async (req, res) => {
    const { roomId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC`,
            [roomId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.messages });
    }
})

// create new message in chat
router.post('/:roomId/', async (req, res) => {
    const { roomId } = req.params;
    const { sender_id, receiver_id, content } = req.body;
    if (!sender_id || !receiver_id || !content) {
        res.status(400).json({ error: "Missing required fields" });
    }
    
    const timestamp = new Date().toISOString();
    const is_read = false;

    try {
        const result = await pool.query(
            `INSERT INTO messages (room_id, sender_id, receiver_id, content, created_at, is_read) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [roomId, sender_id, receiver_id, content, timestamp, is_read]
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
router.put('/:messageId', async (req, res) => {
    const { messageId } = req.params;
    const { isRead } = req.body;

    try {
        const result = await pool.query(
            'UPDATE messages SET is_read = $1 WHERE id = $2 RETURNING *',
            [isRead, messageId]
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