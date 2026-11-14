'use strict';

const fca = require('..');
const adapter = new fca.MockAdapter({
  threads: { 'demo-thread': { name: 'Demo thread', participantIDs: [] } }
});

async function main() {
  const api = fca.createClient({ adapter });
  api.on('connected', () => console.log('MaRuF FCA connected'));
  api.on('messageSent', ({ result }) => console.log('Sent:', result.messageID));
  await api.connect();
  await api.sendMessage({ body: 'Hello from fca-maruf 1.0.0' }, 'demo-thread');
  console.log(await api.getThreadInfo('demo-thread'));
  await api.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
