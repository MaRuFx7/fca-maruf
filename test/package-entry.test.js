'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fca = require('..');

test('package default export is the legacy login function', () => {
  assert.equal(typeof fca, 'function');
  assert.equal(fca.login, fca);
  assert.equal(typeof fca.createClient, 'function');
  assert.equal(typeof fca.Client, 'function');
  assert.equal(typeof fca.MockAdapter, 'function');
});
