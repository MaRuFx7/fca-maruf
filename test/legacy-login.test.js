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
  assert.notEqual(received.callback, callback);
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

test('adds api.stopListening compatibility for transports returning a stop function', () => {
  let stopped = 0;
  const api = {
    listenMqtt() {
      return () => { stopped += 1; };
    }
  };
  const login = createLogin(() => (credentials, options, callback) => {
    callback(null, api);
  });

  let returnedApi;
  login({ appState: [] }, (error, value) => {
    assert.ifError(error);
    returnedApi = value;
  });

  const stopHandle = returnedApi.listenMqtt(() => {});
  assert.equal(typeof stopHandle, 'function');

  let stopError = 'not-called';
  returnedApi.stopListening(error => { stopError = error; });
  assert.equal(stopped, 1);
  assert.equal(stopError, null);
});

test('stopListening is safe when no listener is active', () => {
  const api = { listenMqtt() { return () => {}; } };
  const login = createLogin(() => (credentials, options, callback) => callback(null, api));

  login({ appState: [] }, (error, returnedApi) => {
    assert.ifError(error);
    let stopError = 'not-called';
    returnedApi.stopListening(error => { stopError = error; });
    assert.equal(stopError, null);
  });
});

test('does not replace a transport-provided stopListening method', () => {
  const original = () => 'original';
  const api = { listenMqtt() {}, stopListening: original };
  const login = createLogin(() => (credentials, options, callback) => callback(null, api));

  login({ appState: [] }, (error, returnedApi) => {
    assert.ifError(error);
    assert.equal(returnedApi.stopListening, original);
  });
});
