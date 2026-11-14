# fca-maruf

**MaRuF FCA — version 1.0.0**

A modular, adapter-based messaging client framework for Node.js 20+. It provides a transport-neutral client, adapter contract, local rate limiter, and mock adapter for development and automated testing.

> **Scope:** This release is a framework foundation, not a drop-in Facebook Chat API implementation. It does not include Facebook login, cookie import, scraping, private endpoint automation, or undocumented network transport. Integrations must use authorized interfaces and comply with platform terms.

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
const api = fca.createClient({ adapter: new fca.MockAdapter() });

api.on('connected', () => console.log('Connected'));
api.on('messageSent', ({ result }) => console.log(result));
api.on('error', error => console.error('Adapter error:', error));

async function main() {
  await api.connect();
  await api.sendMessage({ body: 'Hello world' }, 'demo-thread');
  await api.disconnect();
}
main().catch(console.error);
```

## Public API
- `createClient({ adapter, rateLimit, logger })`
- `client.connect(options?)`
- `client.disconnect()`
- `client.sendMessage({ body }, threadID[, callback])`
- `client.getThreadInfo(threadID)`
- `client.getUserInfo(userID)`
- `BaseAdapter`, `MockAdapter`, and typed errors via `fca.errors`

The client emits `connected`, `disconnected`, and `messageSent`. Connection failures are re-thrown as `AdapterError`; when an `error` listener is registered, the error is also emitted.

## Adapter contract
Extend `BaseAdapter` or provide an object with `connect(options, client)`, `disconnect()`, and `sendMessage(message, threadID)`. Optional lookups are `getThreadInfo(threadID)` and `getUserInfo(userID)`.

Adapters own transport authorization, validation, retry policy, and compliance. Never commit tokens, cookies, passwords, or session files. Use environment variables or a secret manager.

## Rate limiting
The client applies a local sliding-window limiter. Configure `rateLimit: { max, windowMs }`; defaults are 30 calls per 60 seconds. This is a local guard, not a substitute for platform-side limits.

## Development
```bash
npm test
node examples/basic.js
```
GitHub Actions runs tests on Node.js 20, 22, and 24 for pushes, pull requests, and manual runs.

## Current status
- [x] CommonJS package foundation
- [x] Adapter contract and mock transport
- [x] Event-based client core
- [x] Input validation and local rate limiting
- [x] Lifecycle and callback unit tests
- [x] Continuous integration workflow
- [ ] Documented, authorized platform transport adapter
- [ ] External adapter conformance suite
- [ ] Release verification and npm publication

## License
MIT. See [LICENSE](LICENSE).
