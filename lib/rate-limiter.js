'use strict';

const { RateLimitError, ValidationError } = require('./errors');

class RateLimiter {
  constructor({ max = 30, windowMs = 60000 } = {}) {
    if (!Number.isInteger(max) || max < 1 || !Number.isFinite(windowMs) || windowMs < 1) {
      throw new ValidationError('Rate limiter max and windowMs must be positive numbers.');
    }
    this.max = max;
    this.windowMs = windowMs;
    this.timestamps = [];
  }
  consume(now = Date.now()) {
    this.timestamps = this.timestamps.filter((time) => now - time < this.windowMs);
    if (this.timestamps.length >= this.max) throw new RateLimitError();
    this.timestamps.push(now);
  }
}
module.exports = { RateLimiter };
