'use strict';

function decorateApi(api) {
  if (!api || typeof api !== 'object') return api;
  if (typeof api.listenMqtt !== 'function' || typeof api.stopListening === 'function') {
    return api;
  }

  const originalListenMqtt = api.listenMqtt;
  let activeStop = null;

  api.listenMqtt = function listenMqtt(...args) {
    const stop = originalListenMqtt.apply(this, args);
    activeStop = typeof stop === 'function' ? stop : null;
    return stop;
  };

  // Some FCA implementations expose the listener's stop function as the
  // return value of listenMqtt(), while GoatBot integrations may call
  // api.stopListening(callback). Bridge both contracts without changing
  // the transport's event or network behavior.
  api.stopListening = function stopListening(callback) {
    const stop = activeStop;
    activeStop = null;

    if (!stop) {
      const error = new Error('No active MQTT listener to stop.');
      if (typeof callback === 'function') callback(error);
      return undefined;
    }

    try {
      const result = stop();
      if (typeof callback === 'function') callback(null);
      return result;
    } catch (error) {
      if (typeof callback === 'function') callback(error);
      else throw error;
      return undefined;
    }
  };

  return api;
}

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

    // Keep transport login and API operations authoritative. Only normalize
    // the listener shutdown shape when the transport returns a stop function.
    const transportCallback = (error, api) => {
      callback(error, error ? api : decorateApi(api));
    };

    return transport(credentials, options || {}, transportCallback);
  };
}

module.exports = { createLogin, decorateApi };
