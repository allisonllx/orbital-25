const mockRedis = {
    connect: jest.fn().mockResolvedValue(),
    quit: jest.fn().mockResolvedValue(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  
jest.mock('redis', () => ({ createClient: () => mockRedis }));

const request = require('supertest');
const app = require('../../app');
const pool = require('../../db/index');
const socketServer = require('../../services/socket');

jest.mock('../../db/index');
jest.mock('../../services/socket');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chat Endpoints', () => {
  test('GET /chats/messages/:messageId - returns a message', async () => {
    const mockMessage = { id: 1, content: 'Hello' };
    pool.query.mockResolvedValueOnce({ rows: [mockMessage] });

    const res = await request(app).get('/chats/messages/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockMessage);
  });

  test('GET /chats/rooms/:roomId/ - returns messages in room', async () => {
    const mockMessages = [{ id: 1, room_id: '1_2', content: 'msg1' }, { id: 2, room_id: '1_2', content: 'msg2' }];
    pool.query.mockResolvedValueOnce({ rows: mockMessages });

    const res = await request(app).get('/chats/rooms/1_2/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockMessages);
  });

  test('GET /chats/rooms/users/:userId - returns rooms for user', async () => {
    const mockRooms = [{ room_id: '1_2', last_message_content: 'hi' }];
    pool.query.mockResolvedValueOnce({ rows: mockRooms });

    const res = await request(app).get('/chats/rooms/users/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockRooms);
  });

  test('POST /chats/rooms/:roomId/ - missing fields returns 400', async () => {
    const res = await request(app).post('/chats/rooms/1_2/').send({ sender_id: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  test('POST /chats/rooms/:roomId/ - creates message and emits event', async () => {
    const mockMessage = {
      id: 1,
      room_id: '1_2',
      sender_id: 1,
      receiver_id: 2,
      content: 'Hello',
      created_at: new Date().toISOString(),
      is_read: false,
    };

    pool.query
      .mockResolvedValueOnce({ rows: [mockMessage] }) // insert message
      .mockResolvedValueOnce({ rows: [] }); // update last_message_id

    socketServer.emitWithRetry.mockResolvedValue();

    const res = await request(app).post('/chats/rooms/1_2/').send({
      sender_id: 1,
      receiver_id: 2,
      content: 'Hello',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Comment created successfully');
    expect(res.body.content).toEqual(mockMessage);
    expect(socketServer.emitWithRetry).toHaveBeenCalledWith(
        socketServer.io,
        mockMessage.room_id,
        'receive-message',
        mockMessage
    );
    // expect(pool.query).toHaveBeenNthCalledWith(
    //     2, // second call
    //     expect.stringContaining('UPDATE rooms SET last_message_id'),
    //     [mockMessage.id, '1_2']
    //   );
  });

  test('PUT /chats/messages/:messageId - updates is_read status', async () => {
    const updatedMessage = { id: 1, is_read: true };
    pool.query.mockResolvedValueOnce({ rows: [updatedMessage] });

    const res = await request(app).put('/chats/messages/1').send({ isRead: true });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(updatedMessage);
  });

  test('PUT /chats/messages/:messageId - message not found returns 404', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/chats/messages/999').send({ isRead: true });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Message not found');
  });
  
  test('handles DB errors gracefully', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app).get('/chats/messages/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('DB failure');
  });
});