'use strict';

class FCAError extends Error {
  constructor(message, code = 'FCA_ERROR', options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
  }
}
class ValidationError extends FCAError {
  constructor(message) { super(message, 'VALIDATION_ERROR'); }
}
class AdapterError extends FCAError {
  constructor(message, options = {}) { super(message, 'ADAPTER_ERROR', options); }
}
class NotConnectedError extends FCAError {
  constructor() { super('Client is not connected. Call connect() first.', 'NOT_CONNECTED'); }
}
class RateLimitError extends FCAError {
  constructor(message = 'Local request rate limit exceeded.') { super(message, 'RATE_LIMIT'); }
}

module.exports = { FCAError, ValidationError, AdapterError, NotConnectedError, RateLimitError };
