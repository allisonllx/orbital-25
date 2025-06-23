const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env' });
const app = require('./app');
const pool = require('/db.js');
// const { generateRoomId } = require('./utils');

// const saveMessage = async ({ sender_id, receiver_id, content }) => {
//     const query = 'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *';
//     const values = [sender_id, receiver_id, content];
//     const result = await pool.query(query, values);
//     return result.rows[0];
// }

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: '*' }, // leave as it is for dev, change for prod
    connectionStateRecovery: {}, // for handling disconnections via temporary storage of events sent by the server
    pingInterval: 10000, // ping every 10s
    pingTimeout: 5000, // wait 5s for pong
});

const onlineUsers = new Set();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user-online', (userId) => {
        onlineUsers.add(userId);
        io.emit('presence-update', { userId, status: 'online' }); // broadcast status to all connected clients
      });
    
      // update last seen
      socket.on('user-offline', async ({ userId }) => {
        onlineUsers.delete(userId);
        io.emit('presence-update', { userId, status: 'offline' });
        try {
            await pool.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);
          } catch (err) {
            console.error('Error updating last seen:', err);
          }
      }); 

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    // socket.on('send-message', async ({ sender_id, receiver_id, content }) => {
    //     try {
    //         const message = await saveMessage({ sender_id, receiver_id, content });
    //         const roomId = generateRoomId(sender_id, receiver_id);
    //         io.to(roomId).emit('receive-message', message);
    //     } catch (err) {
    //         console.error(err);
    //         socket.emit('error', 'Failed to send message');
    //     }
        
    // });

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

const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 3;

const emitWithRetry = async (io, roomId, event, data, retries = MAX_RETRIES) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const sendEvent = () => {
      attempts++;
      io.to(roomId).emit(event, data, (ack) => {
        if (ack) {
          console.log(`Acknowledgment received for event: ${event}`);
          resolve();
        } else if (attempts < retries) {
          console.log(`No acknowledgment received for event: ${event}, retrying... (${attempts})`);
          setTimeout(sendEvent, RETRY_INTERVAL);
        } else {
          console.log(`Failed to deliver event: ${event} after ${retries} attempts`);
          reject(new Error(`Failed to deliver event: ${event} after ${retries} attempts`));
        }
      });
    };
    sendEvent();
  });
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = { io, emitWithRetry };

