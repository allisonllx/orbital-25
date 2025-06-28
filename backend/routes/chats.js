const express = require('express');
const router = express.Router();
const pool = require('../db.js');
const { io, emitWithRetry } = require('../socketServer');

// fetch a single message by id
router.get('/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages WHERE id = $1`,
            [messageId]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// fetch all messages in a chat
router.get('/rooms/:roomId', async (req, res) => {
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

// fetch all rooms for a single user
router.get('/rooms/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT r.*, m.content AS last_message_content, m.created_at AS last_message_time
             FROM rooms r
             LEFT JOIN messages m ON r.last_message_id = m.id
             WHERE r.user1_id = $1 OR r.user2_id = $1
             ORDER BY m.created_at DESC NULLS LAST;`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// create new message in chat
router.post('/rooms/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const { sender_id, receiver_id, content } = req.body;
    if (!sender_id || !receiver_id || !content) {
        res.status(400).json({ error: "Missing required fields" });
    }
    
    const timestamp = new Date().toISOString();
    const is_read = false;

    try {
        const result = await pool.query(
            `INSERT INTO messages (room_id, sender_id, receiver_id, content, created_at, is_read) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [roomId, sender_id, receiver_id, content, timestamp, is_read]
        );

        const message = result.rows[0];

        // emit event to send message data to connected clients
        const hasListeners = io.sockets.adapter.rooms.get(message.room_id)?.size > 0;
        if (hasListeners) {
            await emitWithRetry(io, message.room_id, 'receive-message', message)
                .catch(console.error);   // don’t let a socket error kill the request
        }
        // await emitWithRetry(io, message.room_id, 'receive-message', message);
        // io.to(message.room_id).emit('receive-message', message);

        // update last message in corresponding room (or create the room if yet created)
        await pool.query(
            `INSERT INTO rooms (room_id, user1_id, user2_id, last_message_id)
             VALUES ($1,
                     LEAST($2::int, $3::int),        -- smaller ID  → user1
                     GREATEST($2::int, $3::int),     -- larger  ID  → user2
                     $4)
             ON CONFLICT (room_id)                   -- room already exists
             DO UPDATE
               SET last_message_id = EXCLUDED.last_message_id`,
            [roomId, sender_id, receiver_id, message.id]
        );

        res.status(201).json({
            message: "Comment created successfully",
            content: message
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// update messages (for is_read)
router.put('/messages/:messageId', async (req, res) => {
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