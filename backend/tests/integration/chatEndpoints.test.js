const request = require('supertest');
const app = require('../../app');
const pool = require('../../db.js');
const socketServer = require('../../socketServer');

jest.mock('../../db.js');
jest.mock('../../socketServer');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Chat Endpoints', () => {
  test('GET /messages/:messageId - returns a message', async () => {
    const mockMessage = { id: 1, content: 'Hello' };
    pool.query.mockResolvedValueOnce({ rows: [mockMessage] });

    const res = await request(app).get('/messages/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockMessage);
  });

  test('GET /rooms/:roomId/ - returns messages in room', async () => {
    const mockMessages = [{ id: 1, room_id: '1_2', content: 'msg1' }, { id: 2, room_id: '1_2', content: 'msg2' }];
    pool.query.mockResolvedValueOnce({ rows: mockMessages });

    const res = await request(app).get('/rooms/1_2/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockMessages);
  });

  test('GET /rooms/users/:userId - returns rooms for user', async () => {
    const mockRooms = [{ room_id: '1_2', last_message_content: 'hi' }];
    pool.query.mockResolvedValueOnce({ rows: mockRooms });

    const res = await request(app).get('/rooms/users/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockRooms);
  });

  test('POST /rooms/:roomId/ - missing fields returns 400', async () => {
    const res = await request(app).post('/rooms/1_2/').send({ sender_id: 1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/i);
  });

  test('POST /rooms/:roomId/ - creates message and emits event', async () => {
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
      .mockResolvedValueOnce({}); // update last_message_id

    socketServer.emitWithRetry.mockResolvedValue();

    const res = await request(app).post('/rooms/1_2/').send({
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
    expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rooms SET last_message_id'),
        [mockMessage.id, '1_2']
      );
  });

  test('PUT /messages/:messageId - updates is_read status', async () => {
    const updatedMessage = { id: 1, is_read: true };
    pool.query.mockResolvedValueOnce({ rows: [updatedMessage] });

    const res = await request(app).put('/messages/1').send({ isRead: true });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(updatedMessage);
  });

  test('PUT /messages/:messageId - message not found returns 404', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).put('/messages/999').send({ isRead: true });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Message not found');
  });
  
  test('handles DB errors gracefully', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app).get('/messages/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('DB failure');
  });
});