import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InMemoryRunner } from '@google/adk';

/**
 * Returns true only when the file is executed directly via `node <file.js>`,
 * and false when imported by `adk web` or another module.
 */
export function isMain(importMetaUrl) {
  if (!process.argv[1]) return false;
  return path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl);
}

/**
 * Runs a single demonstration turn in its own session and logs tool calls + reply.
 */
export async function askAgent(
  agent,
  prompt,
  { role = 'student', studentId = 'student_ines' } = {}
) {
  const runner = new InMemoryRunner({ agent, appName: 'evora_demo' });
  const session = await runner.sessionService.createSession({
    appName: 'evora_demo',
    userId: studentId,
    state: { role, studentId },
  });

  console.log(`\n👤 [${role}] ${prompt}`);
  let reply = '';

  for await (const event of runner.runAsync({
    userId: studentId,
    sessionId: session.id,
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    const parts = event.content?.parts ?? [];
    for (const part of parts) {
      if (part.functionCall) {
        console.log(
          `   🔧 tool -> ${part.functionCall.name}(${JSON.stringify(part.functionCall.args)})`
        );
      }
    }
    if (event.author === agent.name) {
      const text = parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join('\n');
      if (text) reply = text;
    }
  }

  console.log(`🤖 ${reply}`);
  return reply;
}
