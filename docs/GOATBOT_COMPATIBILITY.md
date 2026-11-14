# GoatBot V2 compatibility audit

Audit target: `MaRuFx7/Prime` (the user's Prime/GoatBot-derived project), branch `main`.
This document records observed call sites and the current integration boundary. It is not a claim that the entire bot has passed a live Facebook integration test.

## Reference repository review

The additional reference `Tinkprocodes/fca-unofficial` identifies itself as a fork of the classic unofficial Facebook Chat API and publishes version `1.3.15` in its package metadata. Its package declares an MIT license and exposes the classic callback-oriented FCA API.

The reference is useful for API shape and compatibility expectations, but it is not a clean drop-in transport for Prime as currently published:

- Its `utils.js` reads `./data.json` from the process working directory during module initialization.
- Its `src/listenMqtt.js` also reads `./data.json` and imports a logger from `process.cwd() + "/declare/logger"`.
- Those are application-specific runtime assumptions, not standard FCA dependencies. A consumer that does not provide those files can fail before a login callback is reached.
- Its documented `listenMqtt(callback)` returns a stop function. Prime also calls `api.stopListening(callback)` in its listener lifecycle.

For that reason, `fca-maruf` does not blindly replace its transport dependency with this fork. The source is used as a compatibility reference; transport adoption requires removing application-specific coupling and verifying the full dependency graph first.

Reference: [Tinkprocodes/fca-unofficial](https://github.com/Tinkprocodes/fca-unofficial).

## Login and listener contract observed in Prime

Prime uses the classic FCA entry point:

```js
login({ appState }, optionsFca, (error, api) => {
  if (error) return handleError(error);
  api.listenMqtt((listenError, event) => {
    // dispatch event
  });
});
```

The package entry point in `fca-maruf` supports this callable CommonJS shape. It forwards credentials, options, and the callback to the configured transport and returns the transport's return value unchanged.

Some FCA implementations return a stop function from `api.listenMqtt()`, while Prime may call `api.stopListening(callback)`. The compatibility layer now adds `api.stopListening(callback)` only when the transport does not already provide it. It delegates to the stop function returned by the active `listenMqtt()` call; it does not implement MQTT or alter event delivery.

## Current integration in Prime

Prime's `package.json` points to `fca-maruf` at a pinned Git commit, and `bot/login/login.js` imports `fca-maruf` instead of importing the transport package directly. This wires the GoatBot login call site through the new package entry point.

**Transport boundary:** `fca-maruf` currently depends on `@eryxenx/fca` for actual Facebook login, appState processing, MQTT delivery, and FCA API operations. Those operations are not implemented independently inside `fca-maruf`. The bridge is deliberately transparent; it does not fake successful login or fabricate API responses.

## Confirmed API methods from audited Prime files

| Method | Observed usage |
|---|---|
| `getCurrentUserID()` | Identify the logged-in bot account |
| `listenMqtt(callback)` | Receive message and event updates |
| `stopListening(callback)` | Stop the active listener |
| `sendMessage(message, threadID[, callback])` | Send text/replies |
| `getThreadList(limit, timestamp, folder)` | Load inbox threads |
| `getThreadInfo(threadID)` | Read group/thread metadata |
| `getUserInfo(userID)` | Read user profile metadata |
| `markAsRead(threadID)` | Mark a thread read |
| `markAsDelivered(threadID, messageID)` | Mark a message delivered |
| `unsendMessage(messageID)` | Unsend a message |
| `addUserToGroup(userID, threadID[, callback])` | Add a participant |
| `removeUserFromGroup(userID, threadID[, callback])` | Remove a participant |
| `changeNickname(nickname, threadID, userID[, callback])` | Change a participant nickname |
| `changeThreadEmoji(emoji, threadID[, callback])` | Change group chat emoji |
| `setOptions(options)` | Update runtime FCA options |

Optional/version-specific extensions observed defensively by Prime include `getHumanizer()`, `sessionGuard(path, options)`, and `_connectE2EEAndMerge()`. They are not part of the minimum login bridge contract and are not implemented by `fca-maruf`.

## Event fields Prime consumes

For ordinary message events, Prime reads `type`, `threadID`, `senderID` (with `userID` / `author` fallbacks), `messageID`, `body`, `isGroup`, optional `participantIDs`, and optional `isE2EE`. The dispatcher also handles `message`, `message_reply`, `message_unsend`, `event`, `message_reaction`, `typ`, `presence`, and `read_receipt` event types. Full event coverage still needs an integration test against the exact GoatBot version.

## Validation status

- [x] Legacy CommonJS login signature and callback forwarding covered by unit tests.
- [x] Package default export is tested as a callable function.
- [x] Listener stop-function to `api.stopListening(callback)` compatibility is covered by unit tests.
- [ ] Clean-install Prime and confirm the pinned Git dependency resolves.
- [ ] Run a controlled integration test and verify login, event delivery, send, and listener shutdown.

A passing unit test confirms the wrapper contract only. It does not prove that Facebook login or a live GoatBot session works.

## Next implementation work

1. Expand the API usage audit across all Prime command/event modules.
2. Add conformance tests for every API method Prime calls, keeping transport behavior explicit.
3. Evaluate whether the reference fork's app-specific runtime dependencies can be cleanly separated before adopting any of its transport implementation.
4. Only claim full GoatBot compatibility after a successful, controlled end-to-end integration test.
