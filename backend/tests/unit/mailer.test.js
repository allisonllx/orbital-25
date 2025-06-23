const sendResetEmail = require('../../mailer');
const { Resend } = require('resend');

// mock the `Resend` class
jest.mock('resend');

describe('sendResetEmail', () => {
  const mockSend = jest.fn();
  const mockResendInstance = { emails: { send: mockSend } };

  beforeEach(() => {
    Resend.mockImplementation(() => mockResendInstance);
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
