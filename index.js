'use strict';

const { createClient, Client } = require('./lib/client');
const { BaseAdapter } = require('./lib/base-adapter');
const { MockAdapter } = require('./adapters/mock');
const { createLogin } = require('./lib/legacy-login');
const errors = require('./lib/errors');

// GoatBot's legacy FCA contract: require('fca-maruf')({ appState }, options, cb).
const login = createLogin(() => require('@eryxenx/fca'));

module.exports = login;
module.exports.login = login;
module.exports.createClient = createClient;
module.exports.Client = Client;
module.exports.BaseAdapter = BaseAdapter;
module.exports.MockAdapter = MockAdapter;
module.exports.errors = errors;
