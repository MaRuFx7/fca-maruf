'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient, MockAdapter, errors } = require('..');

test('connects, sends a message and disconnects', async () => {
  const adapter = new MockAdapter();
  const client = createClient({ adapter });
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
  const client = createClient({
    adapter: new MockAdapter({ threads: { t1: { name: 'Demo' } }, users: { u1: { name: 'User' } } })
  });
  await client.connect();
  assert.deepEqual(await client.getThreadInfo('t1'), { name: 'Demo' });
  assert.deepEqual(await client.getUserInfo('u1'), { name: 'User' });
});
