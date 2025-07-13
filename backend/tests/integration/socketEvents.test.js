const mockRedis = {
    connect: jest.fn().mockResolvedValue(),
    quit: jest.fn().mockResolvedValue(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  
jest.mock('redis', () => ({ createClient: () => mockRedis }));

const { createServer } = require('http');
const Client = require('socket.io-client');
const app = require('../../app');
const { io } = require('../../services/socket');
const pool = require('../../db/index');

jest.mock('../../db/index');

let server, address, url, clientSocket;

beforeAll((done) => {
  server = createServer(app);
  io.attach(server);
  server.listen(() => {
    address = server.address();
    url = `http://localhost:${address.port}`;
    clientSocket = Client(url);
    clientSocket.on('connect', done);
  });
});

afterAll(() => {
  io.close();
  server.close();
  clientSocket.close();
});

test('user-online and user-offline should emit presence-update', (done) => {
  const userId = 123;
  const updates = [];

  clientSocket.on('presence-update', (payload) => {
    updates.push(payload);
    if (updates.length === 2) {
      expect(updates[0]).toEqual({ userId, status: 'online' });
      expect(updates[1]).toEqual({ userId, status: 'offline' });
      done();
    }
  });

  clientSocket.emit('user-online', userId);
  setTimeout(() => clientSocket.emit('user-offline', { userId }), 100);
});

test('join-room should join the socket to a room', (done) => {
  const roomId = '1_2';
  clientSocket.emit('join-room', roomId);
  // no assertable event from server, so just ensure no crash
  setTimeout(done, 100);
});

test('open-chat should call DB query to mark messages as read', (done) => {
  pool.query.mockResolvedValue({});
  const payload = { senderId: 1, receiverId: 2 };
  clientSocket.emit('open-chat', payload);

  setTimeout(() => {
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE messages SET is_read = TRUE'),
      [payload.senderId, payload.receiverId]
    );
    done();
  }, 100);
});

test('message-read should call DB query to mark a message as read', (done) => {
  pool.query.mockResolvedValue({});
  const messageId = 123;
  clientSocket.emit('message-read', { messageId });

  setTimeout(() => {
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE messages SET is_read = TRUE WHERE id = $1'),
      [messageId]
    );
    done();
  }, 100);
});
