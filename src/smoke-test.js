import {
  OLLAMA_HOST,
  OLLAMA_MODEL,
  OLLAMA_EMBED_MODEL,
  embedText,
} from './lib/ollama.js';

console.log(`🔍 Checking Ollama at ${OLLAMA_HOST}`);
console.log(`   Chat model:  ${OLLAMA_MODEL}`);
console.log(`   Embed model: ${OLLAMA_EMBED_MODEL}\n`);

const chatRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: OLLAMA_MODEL,
    stream: false,
    messages: [{ role: 'user', content: 'Say "Olá DevFest Évora!" and nothing else.' }],
  }),
});

if (!chatRes.ok) {
  throw new Error(`Chat check failed (${chatRes.status}): ${await chatRes.text()}`);
}
const chatData = await chatRes.json();
console.log(`✅ Chat OK: ${chatData.message?.content?.trim()}`);

const vector = await embedText('Distributed Systems at University of Évora');
console.log(`✅ Embeddings OK: ${vector.length} dimensions`);
console.log('\n🚀 All set! Run `npm run step1` to start the workshop.');
