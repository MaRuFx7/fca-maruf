# GoatBot V2 compatibility audit

Audit target: `MaRuFx7/Prime` (the user's Prime/GoatBot-derived project), branch `main`.
This document records observed call sites and contracts. It is not a claim that this package is already GoatBot-compatible.

## Login and listener contract observed in Prime

Prime imports `@eryxenx/fca` and calls:

```js
login({ appState }, optionsFca, (error, api) => {
  // use api
  api.listenMqtt((error, event) => {
    // process event
  });
});
```

Compatibility requirements:

- CommonJS entry point callable as `login(credentials, options, callback)`.
- App-state login via `{ appState: [...] }`.
- Callback receives `(error, api)`.
- `api.getCurrentUserID()` is used immediately after login.
- `api.listenMqtt(callback)` delivers `(error, event)`.
- Listener handle must be stoppable; Prime uses `api.stopListening(callback)` before restarting the listener.
- The API also needs a Promise-friendly surface because Prime awaits several API calls directly.

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

Optional/version-specific extensions used defensively by Prime:

- `getHumanizer()` — optional helper queried only if present.
- `sessionGuard(path, options)` — optional session persistence helper.
- `_connectE2EEAndMerge()` — optional private extension; not part of the minimum compatibility target.

The audited Prime command/event files additionally call `getThreadInfo`, `getUserInfo`, `getThreadList`, `sendMessage`, `getCurrentUserID`, `addUserToGroup`, `removeUserFromGroup`, `changeNickname`, and `changeThreadEmoji`.

## Event fields Prime consumes

For ordinary message events, Prime reads:

- `type`, `threadID`, `senderID` (with `userID` / `author` fallbacks)
- `messageID`, `body`, `isGroup`
- `participantIDs` when available
- `isE2EE` as an optional extension

Prime's event dispatcher also expects event types such as `message`, `typ`, and `presence`. The exact complete event taxonomy must be validated against the target GoatBot version before declaring full compatibility.

## Important compatibility distinction

The current `fca-maruf` code is an adapter-based framework. It does **not** yet implement the login protocol, app-state handling, Facebook transport, MQTT ingestion, or the methods listed above. A mock adapter passing unit tests is not proof of Facebook/GoatBot compatibility.

## Implementation order

1. Freeze the public login and callback/Promise contract.
2. Build a transport-independent FCA API facade and deterministic event normalization.
3. Implement only methods with a verified contract and add adapter conformance tests.
4. Add a real transport only against a documented/authorized interface; do not invent undocumented request payloads.
5. Run local unit tests and CI, then perform an explicitly labelled integration test before claiming GoatBot compatibility.

## Sources inspected

- Prime: `package.json`, `bot/login/login.js`, `bot/login/loadData.js`, `bot/login/humanizerOptions.js`, `bot/handler/handlerEvents.js`, `bot/handler/handlerAction.js`, and selected command/event modules.
- Reference FCA: [fca-unofficial/fca-unofficial](https://github.com/fca-unofficial/fca-unofficial), especially its package entry point, `src/sendMessage.js`, `utils.js`, and tests.

Only observed API usage is listed as confirmed. Uninspected commands may require additional methods.
