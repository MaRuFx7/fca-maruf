'use strict';

const { createClient, Client } = require('./lib/client');
const { BaseAdapter } = require('./lib/base-adapter');
const { MockAdapter } = require('./adapters/mock');
const errors = require('./lib/errors');

module.exports = createClient;
module.exports.createClient = createClient;
module.exports.Client = Client;
module.exports.BaseAdapter = BaseAdapter;
module.exports.MockAdapter = MockAdapter;
module.exports.errors = errors;
