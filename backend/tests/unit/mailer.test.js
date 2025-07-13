const mockSend = jest.fn();

// mock the `Resend` class
jest.mock('resend', () => {
    return {
        Resend: jest.fn().mockImplementation(() => ({
            emails: {
              send: mockSend
            }
          }))
    };
});

const sendResetEmail = require('../../services/mailer');

describe('sendResetEmail', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  it('should send email with correct parameters and return data', async () => {
    const mockData = { id: 'email_123' };
    mockSend.mockResolvedValue({ data: mockData, error: null });

    const result = await sendResetEmail('test@example.com', '123456');
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: 'Reset your password',
    }));
    expect(result).toEqual(mockData);
  });

  it('should throw an error if Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: new Error('Send failed') });

    await expect(sendResetEmail('fail@example.com', '000000'))
      .rejects
      .toThrow('Send failed');
  });
});
