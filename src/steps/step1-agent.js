import { LlmAgent } from '@google/adk';
import { localModel } from '../lib/ollama.js';
import { isMain, askAgent } from '../lib/runner.js';

// Step 1: Connect local Ollama (`gemma4:e2b`) to a Google ADK LlmAgent
export const rootAgent = new LlmAgent({
  name: 'evora_assistant',
  description: 'Local University of Évora CS Assistant powered by Gemma 4.',
  model: localModel,
  instruction: `
You are the Computer Science AI Assistant at the University of Évora.
Be concise and friendly.
If you do not know specific room numbers or grading rules, say so clearly instead of guessing.
  `.trim(),
});

if (isMain(import.meta.url)) {
  await askAgent(
    rootAgent,
    'Explain the difference between a process and a thread in 2 sentences.'
  );
  await askAgent(
    rootAgent,
    'What room is CC301 Distributed Systems in at Colégio do Espírito Santo?'
  );
}
