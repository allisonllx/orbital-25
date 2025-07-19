// const rateLimit = require('express-rate-limit');
const { RateLimiterRedis } = require('rate-limiter-flexible');
// const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
// const r = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  // legacyMode: true
});

(async () => {
  await redisClient.connect();
})().catch(console.error);

console.log(redisClient);

// helper: per-user-or-IP key
const userOrIp = (req) => (req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`);

// generic factory for rate limiters
// const makeLimiter = ({ windowMs, max, message }) =>
//   rateLimit({
//     windowMs,
//     max,
//     message,
//     keyGenerator: userOrIp,
//     standardHeaders: true,
//     legacyHeaders: false,
//     store: new RedisStore({
//       client: redisClient
//       // sendCommand: (...args) => redisClient.sendCommand(args)
//     })
//   });

  const makeLimiter = ({ windowMs, max, message }) => {
    const limiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl',
      points: max,
      duration: Math.ceil(windowMs / 1000),
    });
  
    return async (req, res, next) => {
      try {
        await limiter.consume(userOrIp(req));
        next();
      } catch (_) {
        res.status(429).json({ message: message || 'Too many requests' });
      }
    };
  };

// auth (strict, IP-based)
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 min
//   max: 10,
//   message: 'Too many auth attempts — try again later.',
//   standardHeaders: true,
//   legacyHeaders: false
// }); // note: no keyGenerator => defaults to IP
const authLimiter = (() => {
  const limiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'auth',
    points: 15,
    duration: 15 * 60, // 15 min
  });

  return async (req, res, next) => {
    try {
      await limiter.consume(req.ip);
      next();
    } catch (_) {
      res.status(429).json({ message: 'Too many auth attempts — try again later.' });
    }
  };
})();

const usersLimiter = makeLimiter({ windowMs: 60 * 1000, max: 30 });
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