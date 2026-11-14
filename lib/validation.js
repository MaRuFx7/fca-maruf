'use strict';

const { ValidationError } = require('./errors');

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(name + ' must be an object.');
  }
  return value;
}
function requireString(value, name, max = 4096) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(name + ' must be a non-empty string.');
  }
  if (value.length > max) throw new ValidationError(name + ' is too long (max ' + max + ').');
  return value;
}
function validateMessage(message) {
  requireObject(message, 'message');
  if (typeof message.body !== 'string' || message.body.length === 0) {
    throw new ValidationError('message.body must be a non-empty string.');
  }
  if (message.body.length > 10000) throw new ValidationError('message.body exceeds 10000 characters.');
  return message;
}
module.exports = { requireObject, requireString, validateMessage };
