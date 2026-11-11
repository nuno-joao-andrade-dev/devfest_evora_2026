# 00 — Pre-Workshop Setup & Smoke Test

[🏠 Workshop Home](../README.md) &nbsp;|&nbsp; [Next: Step 1 — First Local Agent →](./step-1-local-inference.md)

> **Time:** Pre-workshop (or **5 minutes** in the room)
>
> **Goal:** Make sure **Node.js 22+**, **Ollama**, **`gemma4:e2b`**, and **`embeddinggemma-2`** are ready, install dependencies, and pass `npm run smoke`.

---

## 1. Install Ollama & Pull the Two Models

1. **Node.js 22+:** Check with `node -v`.
2. **Install Ollama:**
   - **macOS / Linux:** `curl -fsSL https://ollama.com/install.sh | sh`
   - **Windows:** Download from [https://ollama.com/download](https://ollama.com/download)
3. **Pull both models (~1.6 GB total):**
   ```bash
   ollama pull gemma4:e2b
   ollama pull embeddinggemma-2
   ```

> [!IMPORTANT]
> **Slow Wi-Fi or Low Battery? Use the Shared Workshop Endpoint!**
> During the live 90-minute workshop, you can skip local inference and point `.env` to the instructor's temporary Ollama server:
> ```ini
> OLLAMA_HOST=http://<WORKSHOP_OLLAMA_ENDPOINT_PROVIDED_LIVE>:11434
> ```
> *(Only active during the workshop—switch back to `http://localhost:11434` afterward for 100% offline use!)*

---

## 2. Install Project Dependencies & Configure `.env`

Inside this repository:

```bash
cp -n .env.example .env
npm install
```

Check your `.env` file:

```ini
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b
OLLAMA_EMBED_MODEL=embeddinggemma-2
```

---

## 3. Run the Smoke Test (`src/smoke-test.js`)

Run:

```bash
npm run smoke
```

Expected output:

```text
🔍 Checking Ollama at http://localhost:11434
   Chat model:  gemma4:e2b
   Embed model: embeddinggemma-2

✅ Chat OK: Olá DevFest Évora!
✅ Embeddings OK: 768 dimensions

🚀 All set! Run `npm run step1` to start the workshop.
```

> [!TIP]
> **What's already inside `src/lib/`?**
> So you can focus 100% on AI agent concepts instead of file-system or HTTP boilerplate, `src/lib/` already gives you:
> - `src/lib/ollama.js` — `OllamaLlm` (connects `@google/adk` to Ollama) + `embedText()` (`embeddinggemma-2`) + `cosineSimilarity()`
> - `src/lib/seed-data.js` & `src/lib/storage.js` — University of Évora CS courses (*Colégio do Espírito Santo*) & tiny JSON helpers

---

[🏠 Workshop Home](../README.md) &nbsp;|&nbsp; [Next: Step 1 — First Local Agent →](./step-1-local-inference.md)
