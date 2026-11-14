# fca-maruf

**MaRuF FCA — version 1.0.0**

A CommonJS FCA compatibility package for Node.js 20+, with a legacy GoatBot login entry point and a separate adapter-based client foundation.

## Install

```bash
npm install fca-maruf
```

## GoatBot / legacy FCA usage

The default export is callable in the classic FCA style used by Prime:

```js
const login = require('fca-maruf');

login({ appState }, optionsFca, (error, api) => {
  if (error) return console.error('FCA login failed:', error);

  console.log('Logged in account:', api.getCurrentUserID());

  api.listenMqtt((listenError, event) => {
    if (listenError) return console.error(listenError);
    if (event.type === 'message') {
      console.log(event.threadID, event.senderID, event.body);
    }
  });
});
```

The compatibility entry point forwards credentials, options, and login to the configured FCA transport. Login, appState processing, MQTT, and Facebook API method behavior are provided by that transport—not independently implemented by this wrapper.

For transports where `listenMqtt()` returns a stop function instead of exposing `api.stopListening()`, the compatibility layer supplies `api.stopListening(callback)` by delegating to the returned stop function. An existing transport-provided `stopListening` method is left unchanged.

**Important:** This is an integration bridge, not yet an independently implemented Facebook transport. Verify the upstream dependency and its current behavior before production use. Never commit `appState`, cookies, passwords, or tokens to GitHub.

## Framework API

The package also exposes the transport-neutral foundation:

- `fca.createClient({ adapter, rateLimit, logger })`
- `client.connect(options?)`, `client.disconnect()`
- `client.sendMessage({ body }, threadID[, callback])`
- `client.getThreadInfo(threadID)`, `client.getUserInfo(userID)`
- `BaseAdapter`, `MockAdapter`, and `fca.errors`

Example:

```js
const fca = require('fca-maruf');
const client = fca.createClient({ adapter: new fca.MockAdapter() });
await client.connect();
await client.sendMessage({ body: 'Hello' }, 'demo-thread');
await client.disconnect();
```

## Development

```bash
npm install
npm test
```

CI tests Node.js 20, 22, and 24. See [docs/GOATBOT_COMPATIBILITY.md](docs/GOATBOT_COMPATIBILITY.md) for the Prime API audit, the Tinkprocodes reference review, and remaining compatibility work.

## License

MIT. See [LICENSE](LICENSE).
