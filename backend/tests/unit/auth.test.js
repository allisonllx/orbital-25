const jwt = require('jsonwebtoken');
const authenticate = require('../../middlewares/auth');

jest.mock('jsonwebtoken');

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    process.env.JWT_SECRET = 'testsecret';
  });

  it('should return 401 if no Authorization header', () => {
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing token' });
  });

  it('should return 401 if token is malformed', () => {
    req.headers.authorization = 'Bearer'; // missing token part
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Malformed token' });
  });

  it('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer faketoken';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should call next and attach decoded user if token is valid', () => {
    req.headers.authorization = 'Bearer validtoken';
    const mockDecoded = { id: 1, email: 'test@example.com' };
    jwt.verify.mockReturnValue(mockDecoded);
    
    authenticate(req, res, next);
    
    expect(req.user).toEqual(mockDecoded);
    expect(next).toHaveBeenCalled();
  });
});
