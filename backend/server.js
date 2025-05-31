const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });
const app = require('./app');
const pool = require('/db.js');

const saveMessage = async ({ sender_id, receiver_id, content }) => {
    const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *';
    const values = [sender_id, receiver_id, content];
    const result = await pool.query(query, values);
    return result.rows[0];
}

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // leave as it is for dev, change for prod
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('send-message', async ({ sender_id, receiver_id, content }) => {
        try {
            const message = await saveMessage({ sender_id, receiver_id, content });
            const roomId = sender_id.toString() + '_' + receiver_id.toString(); // change logic later
            io.to(roomId).emit('receive-message', message);
        } catch (err) {
            console.error(err);
            socket.emit('error', 'Failed to send message');
        }
        
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

