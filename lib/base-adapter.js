'use strict';

const { AdapterError } = require('./errors');

class BaseAdapter {
  async connect() { throw new AdapterError('Adapter must implement connect().'); }
  async disconnect() { throw new AdapterError('Adapter must implement disconnect().'); }
  async sendMessage() { throw new AdapterError('Adapter must implement sendMessage().'); }
  async getThreadInfo() { throw new AdapterError('Adapter must implement getThreadInfo().'); }
  async getUserInfo() { throw new AdapterError('Adapter must implement getUserInfo().'); }
}
module.exports = { BaseAdapter };
