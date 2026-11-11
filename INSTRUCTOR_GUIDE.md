# Facilitator & Instructor Guide — DevFest GDG Évora 2026

[🏠 Workshop Home](./README.md) &nbsp;|&nbsp; [📊 Interactive Slide Deck (`slides/`)](./slides/index.html) &nbsp;|&nbsp; [00 — Setup](./docs/00-setup.md) &nbsp;|&nbsp; [06 — Enterprise Playbook](./docs/06-architecture-and-enterprise-playbook.md)

> **Session:** Building an Autonomous Academic Assistant with Local LLMs: ADK, Gemma, and Dynamic RAG
>
> **Duration:** 90 Minutes &nbsp;|&nbsp; **Format:** Live-Coding / 5-Step Hands-On Workshop

---

## 1. Pre-Workshop Preparation Checklist

### T-1 Week (Attendee Comms)
Ask organizers to send attendees these three pre-workshop instructions so conference Wi-Fi stays uncongested:
1. Install **Node.js 22 LTS+** (`node -v`)
2. Install **Ollama** ([https://ollama.com/download](https://ollama.com/download))
3. Pre-pull the two compact models (~1.6 GB total):
   ```bash
   ollama pull gemma4:e2b
   ollama pull embeddinggemma-2
   ```

### T-30 Minutes (In the Room — Hosting Your Temporary Shared Ollama Endpoint!)

For attendees who arrived late, couldn't finish pulling `gemma4:e2b` over venue Wi-Fi, or have older 4–8 GB laptops, run your **temporary shared workshop Ollama endpoint** (on a GPU laptop/workstation on the venue LAN or a temporary cloud GPU VM):

```bash
# 1. Configure Ollama for concurrent multi-attendee workshop load:
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS="*"
export OLLAMA_MAX_LOADED_MODELS=2      # Keeps BOTH gemma4:e2b AND embeddinggemma-2 in VRAM simultaneously!
export OLLAMA_NUM_PARALLEL=8           # Serves up to 8 concurrent student requests per model without queuing stalls
export OLLAMA_KEEP_ALIVE=2h            # Never evict weights during the 90-minute session

ollama serve
```

In a second terminal on your host machine, **pre-warm both models into memory** before attendees connect:

```bash
curl -s http://localhost:11434/api/chat -d '{"model":"gemma4:e2b","stream":false,"messages":[{"role":"user","content":"warmup"}]}' > /dev/null
curl -s http://localhost:11434/api/embed -d '{"model":"embeddinggemma-2","input":"warmup"}' > /dev/null
ollama ps
# Verify BOTH gemma4:e2b and embeddinggemma-2 appear as loaded in RAM/VRAM!
```

> [!IMPORTANT]
> **Exposing the Endpoint Safely During the 90-Minute Window:**
> - **Same Venue Wi-Fi (Zero-Internet LAN):** Share `http://<YOUR_LAN_IP>:11434` (verify AP client isolation is off!).
> - **Cloud VM / Tunnel:** Put Caddy or Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:11434`) in front and tear down the tunnel/VM right after Q&A so the temporary URL automatically expires when the workshop ends.
> - Write the live `OLLAMA_HOST=...` URL on the whiteboard / sticky header slide so anyone falling behind can switch in 5 seconds!

---

## 2. Minute-by-Minute 90-Minute Run-of-Show

| Clock | Duration | Segment | Instructor Action | Attendee Milestone |
| :---: | :---: | :--- | :--- | :--- |
| **00:00 – 00:08** | 8 min | **Hook, Problem & Setup Check (`00-setup`)** | Present Slides 1–3; display backup `OLLAMA_HOST` URL; run `npm run smoke` live | `npm run smoke` prints green ✅ for chat & embeddings |
| **00:08 – 00:23** | 15 min | **Step 1: Local Inference & ADK (`step-1`)** | Explain `BaseLlm` contract (Slide 4); walk through `src/steps/step1-agent.js`; run `npm run step1` & `npm run web:step1` | Chatting with local `gemma4:e2b` in terminal & `http://localhost:8000` |
| **00:23 – 00:43** | 20 min | **Step 2: Tools & Structured Output (`step-2`)** | Explain `FunctionTool` vs. `AgentTool` + `outputSchema` (Slide 5–6); run `src/steps/step2-tools.js` (`npm run step2`) | Schedule lookup + Zod-validated JSON quiz visible in trace |
| **00:43 – 00:58** | 15 min | **Step 3: Static RAG & Stale-Data Bug (`step-3`)** | Explain cosine similarity (Slide 7); run `npm run step3` (`src/steps/step3-static-rag.js`) to **trigger the conflicting grading bug live!** | Watch `0.86` vs `0.85` contradictory chunks collide in `knowledge-base.json` |
| **00:58 – 01:18** | 20 min | **Step 4: Mutable RAG & Role State (`step-4`)** | Present keyed upserts + `Context.state` RBAC (Slide 8–9); walk through `src/steps/step4-mutable-rag.js` (`npm run step4`) | Student blocked from canceling exam; Professor mutates `v1 → v2` cleanly |
| **01:18 – 01:27** | 9 min | **Step 5: Standalone CLI Assembly (`step-5`)** | Show `InMemoryRunner` (Slide 10); launch `src/steps/step5-cli.js` (`npm start`) and run `/role`, `/kb`, `/audit` | Standalone offline CLI assistant running end-to-end |
| **01:27 – 01:30** | 3 min | **Enterprise Extrapolation & Q&A (`06`)** | Show Enterprise Mapping Matrix & `RoutedLlm` (Slides 11–12); share repo link; Q&A | Clear mental map for applying this at work on Monday |

> [!TIP]
> **Pacing Valve (If Running 5–7 Minutes Behind at Minute 55):**
> Because every step file already exists in `src/steps/`, attendees who fall behind on typing can simply run `npm run step4` directly while you narrate **`upsertKnowledge` (`docKey` + `version++`)** and **`toolContext.state.get('role')`**!

---

## 3. Interactive Slide Deck (`slides/index.html` — 15 Slides)

The ready-to-present Google GDG Évora deck lives at [`slides/index.html`](./slides/index.html) (serve locally with `npm run slides`, open directly in any browser, or publish via GitHub Pages at `/slides/`). Press **`S`** for built-in speaker notes and **`F`** for fullscreen:

1. **Slide 1 — Title Slide:** *Building an Autonomous Academic Assistant with Google ADK, Gemma 4 & Dynamic RAG* — GDG Évora 2026 + click-to-copy `ollama pull` & `npm run smoke`.
2. **Slide 2 — Why Generic Chatbots & Static RAG Fail:** *Colégio do Espírito Santo* room hallucinations (`CES-131`) & the append-only stale-chunk trap.
3. **Slide 3 — Setup Part 1 (Node.js v22+ LTS):** Plain ESM JavaScript setup across macOS/Linux/Windows + `npm install`.
4. **Slide 4 — Setup Part 2 (`gemma4:e2b` + `embeddinggemma-2` + Backup `OLLAMA_HOST`):** ~1.6 GB total footprint + instant `.env` fallback to your live workshop Ollama server.
5. **Slide 5 — 90-Minute Roadmap (5 Ultra-Simple Steps):** Overview of `step1` through `step5` (26–135 LOC each).
6. **Slide 6 — Foundation (`src/lib/ollama.js`):** How `OllamaLlm extends BaseLlm` + `genaiSchemaToJsonSchema` decouple ADK from cloud APIs.
7. **Slide 7 — Step 1 (`step1-agent.js`):** First local `LlmAgent` on `gemma4:e2b` & exposing the ungrounded room gap.
8. **Slide 8 — Visual Debugging (`adk web`):** Live hot-reload, tool trace timeline, and browser Session State inspector on `:8000`.
9. **Slide 9 — Step 2 (`step2-tools.js`):** Deterministic `get_schedule` `FunctionTool` + wrapping `quiz_generator` (`outputSchema`) inside `AgentTool`.
10. **Slide 10 — Step 3 (`step3-static-rag.js`):** Dense vector RAG with `embeddinggemma-2` & reproducing the `0.86` vs `0.85` conflicting grading bug live.
11. **Slide 11 — Architectural Shift:** Side-by-side code comparison of Static RAG (append-only UUIDs) vs. Keyed Mutable RAG (`docKey`, `version++`, RBAC, audit log).
12. **Slide 12 — Step 4A (`step4-mutable-rag.js`):** `upsertKnowledge` (`v1 ➔ v2`) + atomic cross-store sync in `reschedule_lecture`.
13. **Slide 13 — Step 4B (`toolContext.state`):** Blocking unauthorized `[student]` course edits while recording personal student quiz mastery.
14. **Slide 14 — Step 5 (`step5-cli.js`):** Standalone multi-turn CLI via `InMemoryRunner` (`/role`, `/kb`, `/progress`, `/audit`, `/seed`).
15. **Slide 15 — Enterprise Extrapolation & Recap:** Scaling to customer support, `pgvector`, and `RoutedLlm` — *Muito Obrigado, GDG Évora 2026!*

---

## 4. High-Impact Live Demo Moments to Emphasize

1. **Minute 18 (Step 1):** Ask the bare ungrounded agent *"What room is CC301 Distributed Systems at Colégio do Espírito Santo?"* so the audience sees why an LLM alone is useless for live institutional facts.
2. **Minute 53 (Step 3 Climax):** Keep `data/knowledge-base.json` open in a split pane when appending the "Midterm Cancelled" notice. Scroll down so the room physically sees **both** the old 25% midterm chunk and the new 0% midterm chunk sitting in the JSON array—then open a `+ New Session` in `adk web` and watch top-3 retrieval hand both contradictions to `gemma4:e2b`!
3. **Minute 68 (Step 4 Crowd-Pleaser):** Ask an audience member for an outrageous grading change (*"Everyone who attends DevFest Évora gets an automatic 20/20!"*) and run it under `[student]`—watch the guardrail reject it cleanly, then `/role professor` to perform a legitimate update and run `/audit`!

---

## 5. Room Troubleshooting Playbook

- **`npm install` taking too long on conference Wi-Fi:** Keep a USB stick (or simple Python static HTTP file server `python3 -m http.server 9000` on LAN) with a pre-zipped `evora-starter-node-modules.zip` containing `package.json` + `node_modules` just in case venue internet drops!
- **Port `8000` already in use when running `npm run web`:** Run `npx @google/adk-devtools web src/agent.js --port 8080`.
- **Windows PowerShell Unicode / Emoji rendering:** Windows Terminal (default on Win 11) renders UTF-8 cleanly; if an attendee uses legacy `cmd.exe`, run `chcp 65001` first.
- **`gemma4:e2b` skipping a tool call on vague phrasing:** Remind attendees how small 2B models rely heavily on clear tool `description` fields and explicit verbs (*"Check the schedule..."*, *"Generate a practice quiz..."*, *"Search course knowledge..."*).
