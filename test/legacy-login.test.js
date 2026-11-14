'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createLogin } = require('../lib/legacy-login');

test('legacy login forwards credentials, options, and callback to the transport', () => {
  const api = { listenMqtt() {} };
  const credentials = { appState: [{ key: 'c_user', value: 'redacted-test-value' }] };
  const options = { listenEvents: true };
  let received;

  const login = createLogin(() => (creds, opts, callback) => {
    received = { creds, opts, callback };
    callback(null, api);
    return 'transport-handle';
  });

  let callbackResult;
  const callback = (error, result) => { callbackResult = { error, result }; };
  const returned = login(credentials, options, callback);

  assert.equal(returned, 'transport-handle');
  assert.equal(received.creds, credentials);
  assert.equal(received.opts, options);
  assert.equal(received.callback, callback);
  assert.deepEqual(callbackResult, { error: null, result: api });
});

test('legacy login supports omitted options', () => {
  const api = {};
  const login = createLogin(() => (credentials, options, callback) => {
    assert.deepEqual(options, {});
    callback(null, api);
  });

  let result;
  login({ appState: [] }, (error, value) => {
    assert.ifError(error);
    result = value;
  });
  assert.equal(result, api);
});

test('legacy login reports invalid credentials through callback', async () => {
  const login = createLogin(() => () => assert.fail('transport must not be loaded'));
  const error = await new Promise(resolve => login(null, {}, resolve));
  assert.match(error.message, /credentials must be an object/);
});

test('legacy login reports a missing transport through callback', async () => {
  const login = createLogin(() => { throw new Error('transport unavailable'); });
  const error = await new Promise(resolve => login({ appState: [] }, {}, resolve));
  assert.equal(error.message, 'transport unavailable');
});

test('legacy login requires a callback', () => {
  const login = createLogin(() => () => {});
  assert.throws(() => login({ appState: [] }), /requires a callback/);
});
