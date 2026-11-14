# GoatBot V2 compatibility audit

Audit target: `MaRuFx7/Prime` (the user's Prime/GoatBot-derived project), branch `main`.
This document records observed call sites and the current integration boundary. It is not a claim that the entire bot has passed a live Facebook integration test.

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

The package entry point in `fca-maruf` now supports this callable CommonJS shape. It forwards the credentials, options, and callback to the configured transport dependency and returns the transport's return value unchanged. The API object is passed through unchanged, so the transport supplies `getCurrentUserID`, `listenMqtt`, `stopListening`, and the other FCA methods.

## Current integration in Prime

Prime's `package.json` now points to `fca-maruf` at a pinned Git commit, and `bot/login/login.js` imports `fca-maruf` instead of importing the transport package directly. This wires the GoatBot login call site through the new package entry point.

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

Optional/version-specific extensions observed defensively by Prime include `getHumanizer()`, `sessionGuard(path, options)`, and `_connectE2EEAndMerge()`. They are not part of the minimum login bridge contract and are not implemented by `fca-maruf` itself.

## Event fields Prime consumes

For ordinary message events, Prime reads `type`, `threadID`, `senderID` (with `userID` / `author` fallbacks), `messageID`, `body`, `isGroup`, optional `participantIDs`, and optional `isE2EE`. The dispatcher also handles `message`, `message_reply`, `message_unsend`, `event`, `message_reaction`, `typ`, `presence`, and `read_receipt` event types. Full event coverage still needs an integration test against the exact GoatBot version.

## Validation status

- [x] Legacy CommonJS login signature and callback forwarding covered by unit tests.
- [x] Package default export is tested as a callable function.
- [x] GitHub Actions passed for the legacy login contract test commit.
- [ ] Latest package-entry test run must complete successfully.
- [ ] Install Prime from a clean environment and confirm the Git dependency resolves.
- [ ] Run a controlled live integration test and verify login, event delivery, send, and listener shutdown.

A passing unit test confirms the wrapper contract only. It does not prove that Facebook login or a live GoatBot session works.

## Next implementation work

1. Complete the clean-install and dependency-resolution checks for Prime.
2. Expand the API usage audit across all Prime command/event modules.
3. Add conformance tests for every API method Prime calls, while keeping transport behavior delegated and explicit.
4. Only claim full GoatBot compatibility after a successful, controlled end-to-end integration test.

## Sources inspected

- Prime: `package.json`, `bot/login/login.js`, `bot/login/loadData.js`, `bot/login/humanizerOptions.js`, `bot/handler/handlerEvents.js`, `bot/handler/handlerAction.js`, and selected command/event modules.
- Reference FCA: [fca-unofficial/fca-unofficial](https://github.com/fca-unofficial/fca-unofficial), especially its package entry point, `src/sendMessage.js`, `utils.js`, and tests.

Only observed API usage is listed as confirmed. Uninspected commands may require additional methods.
