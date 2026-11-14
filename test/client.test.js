'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient, MockAdapter, BaseAdapter, errors } = require('..');

test('connects, sends a message and disconnects', async () => {
  const client = createClient({ adapter: new MockAdapter() });
  await client.connect();
  const result = await client.sendMessage({ body: 'Hello' }, 'thread-1');
  assert.equal(result.threadID, 'thread-1');
  assert.equal(result.body, 'Hello');
  await client.disconnect();
  assert.equal(client.connected, false);
});

test('rejects sending while disconnected', async () => {
  const client = createClient({ adapter: new MockAdapter() });
  await assert.rejects(client.sendMessage({ body: 'Hello' }, 't'), errors.NotConnectedError);
});

test('validates message bodies', async () => {
  const client = createClient({ adapter: new MockAdapter() });
  await client.connect();
  await assert.rejects(client.sendMessage({ body: '' }, 't'), errors.ValidationError);
});

test('exposes thread and user lookups through the adapter', async () => {
  const client = createClient({ adapter: new MockAdapter({ threads: { t1: { name: 'Demo' } }, users: { u1: { name: 'User' } } }) });
  await client.connect();
  assert.deepEqual(await client.getThreadInfo('t1'), { name: 'Demo' });
  assert.deepEqual(await client.getUserInfo('u1'), { name: 'User' });
});

test('coalesces concurrent connect calls', async () => {
  let calls = 0;
  class SlowAdapter extends BaseAdapter {
    async connect() { calls += 1; await new Promise(resolve => setTimeout(resolve, 10)); }
    async disconnect() {}
    async sendMessage() { return {}; }
  }
  const client = createClient({ adapter: new SlowAdapter() });
  const [a, b] = await Promise.all([client.connect(), client.connect()]);
  assert.equal(a, client);
  assert.equal(b, client);
  assert.equal(calls, 1);
});

test('disconnect waits for an in-flight connection', async () => {
  let disconnected = false;
  class SlowAdapter extends BaseAdapter {
    async connect() { await new Promise(resolve => setTimeout(resolve, 10)); }
    async disconnect() { disconnected = true; }
    async sendMessage() { return {}; }
  }
  const client = createClient({ adapter: new SlowAdapter() });
  const connecting = client.connect();
  const disconnecting = client.disconnect();
  await Promise.all([connecting, disconnecting]);
  assert.equal(disconnected, true);
  assert.equal(client.connected, false);
});

test('callback is called exactly once after successful send', async () => {
  const client = createClient({ adapter: new MockAdapter() });
  await client.connect();
  let calls = 0;
  const result = await client.sendMessage({ body: 'Hi' }, 't', (error, value) => {
    calls += 1;
    assert.equal(error, null);
    assert.equal(value.body, 'Hi');
  });
  assert.equal(result.body, 'Hi');
  assert.equal(calls, 1);
});

test('connection errors reject as AdapterError without requiring an error listener', async () => {
  class BrokenAdapter extends BaseAdapter { async connect() { throw new Error('offline'); } }
  const client = createClient({ adapter: new BrokenAdapter() });
  await assert.rejects(client.connect(), errors.AdapterError);
});
