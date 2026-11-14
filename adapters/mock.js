'use strict';

const { BaseAdapter } = require('../lib/base-adapter');

class MockAdapter extends BaseAdapter {
  constructor({ threads = {}, users = {} } = {}) {
    super();
    this.threads = threads;
    this.users = users;
    this.messages = [];
    this.connected = false;
  }
  async connect() { this.connected = true; }
  async disconnect() { this.connected = false; }
  async sendMessage(message, threadID) {
    if (!this.connected) throw new Error('MockAdapter is not connected.');
    const record = {
      messageID: 'mock-' + (this.messages.length + 1),
      threadID,
      body: message.body,
      timestamp: Date.now()
    };
    this.messages.push(record);
    return record;
  }
  async getThreadInfo(threadID) { return this.threads[threadID] || null; }
  async getUserInfo(userID) { return this.users[userID] || null; }
}
module.exports = { MockAdapter };
