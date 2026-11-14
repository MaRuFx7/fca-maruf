'use strict';

function createLogin(transportLoader) {
  if (typeof transportLoader !== 'function') {
    throw new TypeError('transportLoader must be a function.');
  }

  return function login(credentials, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof callback !== 'function') {
      throw new TypeError(
        'fca-maruf GoatBot compatibility mode requires a callback: login(credentials, options, callback).'
      );
    }

    if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
      const error = new TypeError('credentials must be an object, usually { appState }.');
      queueMicrotask(() => callback(error));
      return undefined;
    }

    if (credentials.appState !== undefined && !Array.isArray(credentials.appState)) {
      const error = new TypeError('credentials.appState must be an array of cookie objects.');
      queueMicrotask(() => callback(error));
      return undefined;
    }

    let transport;
    try {
      transport = transportLoader();
    } catch (error) {
      queueMicrotask(() => callback(error));
      return undefined;
    }

    if (typeof transport !== 'function') {
      const error = new TypeError('The configured FCA transport does not export a login function.');
      queueMicrotask(() => callback(error));
      return undefined;
    }

    // Preserve the upstream FCA callback and API object without emulating
    // login, MQTT, or Facebook operations in this compatibility layer.
    return transport(credentials, options || {}, callback);
  };
}

module.exports = { createLogin };
