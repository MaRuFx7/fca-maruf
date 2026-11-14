# fca-maruf

**MaRuF FCA — version 1.0.0**

A modular, adapter-based messaging client framework for Node.js 20+. This repository starts with a stable core API and a mock adapter so developers can build and test integrations without embedding account credentials or depending on undocumented endpoints.

> **Important:** Version 1.0.0 is the framework foundation, not a drop-in Facebook Chat API implementation. No Facebook login, cookie import, scraping, or undocumented network transport is included. Add only integrations you are authorized to use and that comply with the relevant platform terms.

## Requirements

- Node.js 20+
- CommonJS

## Install

```bash
npm install fca-maruf
```

## Quick start

```js
const fca = require('fca-maruf');

const api = fca.createClient({
  adapter: new fca.MockAdapter()
});

api.on('connected', () => console.log('Connected'));
api.on('messageSent', ({ result }) => console.log(result));

async function main() {
  await api.connect();
  await api.sendMessage({ body: 'Hello world' }, 'demo-thread');
  await api.disconnect();
}

main().catch(console.error);
```

## API

- `createClient({ adapter, rateLimit, logger })` — create a client.
- `client.connect(options?)` — connect the selected adapter.
- `client.disconnect()` — disconnect the adapter.
- `client.sendMessage({ body }, threadID[, callback])` — send text through the adapter.
- `client.getThreadInfo(threadID)` — retrieve thread metadata when supported.
- `client.getUserInfo(userID)` — retrieve user metadata when supported.

The client emits `connected`, `disconnected`, and `messageSent`. Adapter errors are emitted as `error` and re-thrown to the caller. Attach an `error` listener when using EventEmitter error events.

## Build an adapter

Extend `BaseAdapter` or provide an object implementing `connect`, `disconnect`, and `sendMessage`. Optional lookups are `getThreadInfo` and `getUserInfo`.

Adapters are responsible for transport-specific authorization, request validation, retries, and platform policy compliance. Never commit access tokens, cookies, passwords, or session files. Keep secrets in environment variables or a secret manager.

## Development

```bash
npm test
node examples/basic.js
```

## Roadmap

- [x] CommonJS package foundation
- [x] Adapter contract and mock transport
- [x] Event-based client core
- [x] Input validation and local rate limiting
- [x] Node.js built-in tests
- [ ] Documented production adapter contract and conformance tests
- [ ] Authorized transport integrations, subject to platform support and terms

## License

MIT. See [LICENSE](LICENSE).
