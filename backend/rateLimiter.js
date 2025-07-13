const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

// helper: per-user-or-IP key
const userOrIp = (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`);

// generic factory for rate limiters
const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    message,
    keyGenerator: userOrIp,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args)
    })
  });

// auth (strict, IP-based)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: 'Too many auth attempts — try again later.',
  standardHeaders: true,
  legacyHeaders: false
}); // note: no keyGenerator => defaults to IP

const usersLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 30
});

const tasksReadLimiter  = makeLimiter({ windowMs: 60 * 1000,  max: 60 });
const tasksWriteLimiter = makeLimiter({ windowMs: 5  * 60 * 1000, max: 5 });

const chatLimiter = makeLimiter({
  windowMs: 10 * 1000, // 10 s
  max: 20,
  message: 'You are sending messages too fast.'
});

module.exports = {
  authLimiter,
  usersLimiter,
  tasksReadLimiter,
  tasksWriteLimiter,
  chatLimiter
};