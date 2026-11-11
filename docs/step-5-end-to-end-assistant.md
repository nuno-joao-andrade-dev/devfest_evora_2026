# Step 5 — Interactive Assistant CLI (`src/steps/step5-cli.js`)

[← Step 4: Mutable RAG](./step-4-mutable-rag.md) &nbsp;|&nbsp; [🏠 Workshop Home](../README.md) &nbsp;|&nbsp; [Next: 06 — Enterprise Playbook →](./06-architecture-and-enterprise-playbook.md)

> **Duration:** 15 Minutes &nbsp;|&nbsp; **File:** `src/steps/step5-cli.js` *(96 lines)*
>
> **Goal:** Embed your Step 4 `rootAgent` inside a standalone interactive terminal assistant using Google ADK's `InMemoryRunner`—complete with live `/role` switching, `/kb` version inspection, `/progress` mastery tables, and `/audit` history!

---

## 1. The Code (`src/steps/step5-cli.js`)

Open `src/steps/step5-cli.js`:

```javascript
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { InMemoryRunner } from '@google/adk';
import { OLLAMA_HOST, OLLAMA_MODEL } from '../lib/ollama.js';
import { getKnowledgeBase, getAuditLog, getProgress, seedAll } from '../lib/storage.js';
import { rootAgent } from './step4-mutable-rag.js';

const USER_ID = 'student_ines';
const runner = new InMemoryRunner({ agent: rootAgent, appName: 'evora_cli' });

let role = 'student';
let pendingStateDelta = { role, studentId: USER_ID };

const session = await runner.sessionService.createSession({
  appName: 'evora_cli',
  userId: USER_ID,
  state: { ...pendingStateDelta },
});

console.log(`\n🏛️  University of Évora — Autonomous CS Assistant (${OLLAMA_MODEL} @ ${OLLAMA_HOST})`);
console.log('   Commands: /role student | /role professor | /kb | /progress | /audit | /seed | /exit\n');

const rl = readline.createInterface({ input, output });

while (true) {
  let line;
  try {
    line = (await rl.question(`[${role}] You > `)).trim();
  } catch {
    break;
  }
  if (!line) continue;

  if (line === '/exit' || line === '/quit') break;

  if (line.startsWith('/role ')) {
    const nextRole = line.split(/\s+/)[1];
    if (nextRole === 'student' || nextRole === 'professor') {
      role = nextRole;
      pendingStateDelta = { role };
      console.log(`✓ Active role switched to '${role}'.\n`);
    } else {
      console.log('Usage: /role student  OR  /role professor\n');
    }
    continue;
  }

  if (line === '/kb') {
    const kb = await getKnowledgeBase();
    console.table(kb.documents.map((d) => ({ Key: d.docKey, Version: `v${d.version}`, Title: d.title })));
    continue;
  }

  if (line === '/progress') {
    const prog = await getProgress(USER_ID);
    console.table(Object.values(prog.topics));
    continue;
  }

  if (line === '/audit') {
    const logs = await getAuditLog(5);
    console.log(logs.length ? JSON.stringify(logs, null, 2) : 'No mutations recorded yet.');
    console.log('');
    continue;
  }

  if (line === '/seed') {
    const n = await seedAll();
    console.log(`✓ Reset store to ${n} clean documents.\n`);
    continue;
  }

  let reply = '';
  const stateDelta = pendingStateDelta;
  pendingStateDelta = undefined;

  for await (const event of runner.runAsync({
    userId: USER_ID,
    sessionId: session.id,
    newMessage: { role: 'user', parts: [{ text: line }] },
    stateDelta,
  })) {
    const parts = event.content?.parts ?? [];
    for (const part of parts) {
      if (part.functionCall) {
        console.log(`   🔧 tool -> ${part.functionCall.name}(${JSON.stringify(part.functionCall.args)})`);
      }
    }
    if (event.author === rootAgent.name) {
      const text = parts.filter((p) => p.text).map((p) => p.text).join('\n');
      if (text) reply = text;
    }
  }

  console.log(`\nAssistant > ${reply}\n`);
}

rl.close();
console.log('Até logo!');
```

---

## 2. Launch Your Assistant & Try the Full Flow!

Start the CLI (or run `npm run web` if you prefer the browser UI!):

```bash
npm start
```

Try this 60-second graduation walkthrough:

```text
/seed
Explain how a follower becomes a leader in CC301 Raft.
Give me a practice quiz on CC301 Raft leader election.
I scored 100% on Raft Leader Election in CC301—record my progress!
/progress
/role professor
Reschedule CC304 to Friday 16:00-18:00 in CES-204.
/kb
/audit
/role student
When and where does CC304 meet now?
/exit
```

---

## 3. Quick Troubleshooting

| Issue | Fast Fix |
| :--- | :--- |
| `ECONNREFUSED` on `localhost:11434` | Run `ollama serve`, **or** set `OLLAMA_HOST=http://<WORKSHOP_ENDPOINT>:11434` in `.env` |
| Missing `gemma4:e2b` or `embeddinggemma-2` | Run `ollama pull gemma4:e2b && ollama pull embeddinggemma-2` (or use workshop `OLLAMA_HOST`) |
| Messy `data/` after experimenting | Type `/seed` inside the CLI or run `npm run seed` |

---

[← Step 4: Mutable RAG](./step-4-mutable-rag.md) &nbsp;|&nbsp; [🏠 Workshop Home](../README.md) &nbsp;|&nbsp; [Next: 06 — Enterprise Playbook →](./06-architecture-and-enterprise-playbook.md)
