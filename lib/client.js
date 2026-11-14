'use strict';
const { EventEmitter } = require('node:events');
const { BaseAdapter } = require('./base-adapter');
const { RateLimiter } = require('./rate-limiter');
const { requireObject, requireString, validateMessage } = require('./validation');
const { ValidationError, AdapterError, NotConnectedError } = require('./errors');

class Client extends EventEmitter {
  constructor({ adapter, rateLimit, logger = console } = {}) {
    super();
    if (!(adapter instanceof BaseAdapter) && (!adapter || typeof adapter.connect !== 'function' || typeof adapter.disconnect !== 'function' || typeof adapter.sendMessage !== 'function')) {
      throw new ValidationError('adapter must implement connect(), disconnect(), and sendMessage().');
    }
    this.adapter = adapter;
    this.logger = logger;
    this.limiter = new RateLimiter(rateLimit);
    this.connected = false;
    this.connecting = null;
    this.disconnecting = null;
  }

  async connect(options = {}) {
    requireObject(options, 'options');
    if (this.connected) return this;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      try {
        await this.adapter.connect(options, this);
        this.connected = true;
        this.emit('connected');
        return this;
      } catch (error) {
        const wrapped = error instanceof AdapterError ? error : new AdapterError(error?.message || 'Adapter connection failed.', { cause: error });
        if (this.listenerCount('error') > 0) this.emit('error', wrapped);
        throw wrapped;
      } finally {
        this.connecting = null;
      }
    })();
    return this.connecting;
  }

  async disconnect() {
    if (this.disconnecting) return this.disconnecting;
    this.disconnecting = (async () => {
      if (this.connecting) {
        try { await this.connecting; } catch { return; }
      }
      if (!this.connected) return;
      try { await this.adapter.disconnect(); }
      finally {
        this.connected = false;
        this.emit('disconnected');
      }
    })();
    try { await this.disconnecting; }
    finally { this.disconnecting = null; }
  }

  _assertConnected() {
    if (!this.connected) throw new NotConnectedError();
  }

  async sendMessage(message, threadID, callback) {
    let result;
    try {
      this._assertConnected();
      validateMessage(message);
      requireString(String(threadID ?? ''), 'threadID', 256);
      this.limiter.consume();
      result = await this.adapter.sendMessage(message, String(threadID));
    } catch (error) {
      if (typeof callback === 'function') callback(error);
      throw error;
    }
    if (typeof callback === 'function') callback(null, result);
    this.emit('messageSent', { message, threadID: String(threadID), result });
    return result;
  }

  async getThreadInfo(threadID) {
    this._assertConnected();
    requireString(String(threadID ?? ''), 'threadID', 256);
    if (typeof this.adapter.getThreadInfo !== 'function') throw new AdapterError('This adapter does not support getThreadInfo().');
    return this.adapter.getThreadInfo(String(threadID));
  }

  async getUserInfo(userID) {
    this._assertConnected();
    requireString(String(userID ?? ''), 'userID', 256);
    if (typeof this.adapter.getUserInfo !== 'function') throw new AdapterError('This adapter does not support getUserInfo().');
    return this.adapter.getUserInfo(String(userID));
  }
}
function createClient(options) { return new Client(options); }
module.exports = { Client, createClient };
