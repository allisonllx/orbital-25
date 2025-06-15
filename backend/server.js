const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });
const app = require('./app');
const pool = require('/db.js');
const { generateRoomId } = require('./utils');

const saveMessage = async ({ sender_id, receiver_id, content }) => {
    const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *';
    const values = [sender_id, receiver_id, content];
    const result = await pool.query(query, values);
    return result.rows[0];
}

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }, // leave as it is for dev, change for prod
    pingInterval: 10000, // ping every 10s
    pingTimeout: 5000, // wait 5s for pong
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('send-message', async ({ sender_id, receiver_id, content }) => {
        try {
            const message = await saveMessage({ sender_id, receiver_id, content });
            const roomId = generateRoomId(sender_id, receiver_id);
            io.to(roomId).emit('receive-message', message);
        } catch (err) {
            console.error(err);
            socket.emit('error', 'Failed to send message');
        }
        
    });

    // update is_read when receiver opens the chat
    socket.on('open-chat', async ({ senderId, receiverId }) => {
        try {
            await pool.query(
                'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE', 
                [senderId, receiverId]
            );
        } catch (err) {
            console.error('Error marking messages as is_read', err);
        }
    })

    // update is_read for a single message
    socket.on('message-read', async ({ messageId }) => {
        try {
            await pool.query('UPDATE messages SET is_read = TRUE WHERE id = $1', [messageId]);
        } catch (err) {
            console.error('Error updating is_read', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

