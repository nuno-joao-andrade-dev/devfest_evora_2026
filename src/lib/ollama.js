import 'dotenv/config';
import {
  BaseLlm,
  genaiSchemaToJsonSchema,
  generateClientFunctionCallId,
} from '@google/adk';

function normalizeOllamaHost(host) {
  const cleaned = (host || 'http://localhost:11434').trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(cleaned) ? cleaned : `http://${cleaned}`;
}

export const OLLAMA_HOST = normalizeOllamaHost(process.env.OLLAMA_HOST);
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e2b';
export const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || 'embeddinggemma-2';

function extractSystemInstruction(llmRequest) {
  const sys = llmRequest.config?.systemInstruction;
  if (!sys) return '';
  if (typeof sys === 'string') return sys;
  if (Array.isArray(sys)) {
    return sys
      .map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
      .filter(Boolean)
      .join('\n');
  }
  if (typeof sys === 'object' && Array.isArray(sys.parts)) {
    return sys.parts.map((p) => p?.text ?? '').filter(Boolean).join('\n');
  }
  return String(sys);
}

/**
 * Google ADK BaseLlm adapter for Ollama (supports Gemma 4 native tool calling & JSON schemas).
 */
export class OllamaLlm extends BaseLlm {
  constructor({
    model = OLLAMA_MODEL,
    baseUrl = OLLAMA_HOST,
    temperature = 0.2,
  } = {}) {
    super({ model });
    this.baseUrl = normalizeOllamaHost(baseUrl);
    this.temperature = temperature;
  }

  async *generateContentAsync(llmRequest, _stream = false, abortSignal) {
    this.maybeAppendUserContent(llmRequest);

    const messages = [];
    const systemPrompt = extractSystemInstruction(llmRequest);
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    for (const content of llmRequest.contents ?? []) {
      const parts = content.parts ?? [];
      const textParts = parts
        .filter((p) => typeof p.text === 'string')
        .map((p) => p.text);
      const toolCalls = parts.filter((p) => p.functionCall);
      const toolResponses = parts.filter((p) => p.functionResponse);

      if (toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: textParts.join('\n'),
          tool_calls: toolCalls.map((p) => ({
            function: {
              name: p.functionCall.name,
              arguments: p.functionCall.args ?? {},
            },
          })),
        });
      } else if (toolResponses.length > 0) {
        for (const tr of toolResponses) {
          messages.push({
            role: 'tool',
            tool_name: tr.functionResponse.name,
            content: JSON.stringify(tr.functionResponse.response ?? {}),
          });
        }
      } else if (textParts.length > 0) {
        messages.push({
          role: content.role === 'model' ? 'assistant' : 'user',
          content: textParts.join('\n'),
        });
      }
    }

    const ollamaTools = [];
    for (const group of llmRequest.config?.tools ?? []) {
      for (const decl of group.functionDeclarations ?? []) {
        const parameters = decl.parametersJsonSchema
          ? decl.parametersJsonSchema
          : decl.parameters
            ? genaiSchemaToJsonSchema(decl.parameters)
            : { type: 'object', properties: {} };

        ollamaTools.push({
          type: 'function',
          function: {
            name: decl.name,
            description: decl.description ?? '',
            parameters,
          },
        });
      }
    }

    const payload = {
      model: this.model,
      stream: false,
      messages,
      options: {
        temperature: llmRequest.config?.temperature ?? this.temperature,
      },
    };

    if (ollamaTools.length > 0) {
      payload.tools = ollamaTools;
    }
    if (llmRequest.config?.responseSchema) {
      payload.format = genaiSchemaToJsonSchema(llmRequest.config.responseSchema);
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abortSignal,
    });

    if (!res.ok) {
      throw new Error(`Ollama /api/chat failed (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const msg = data.message ?? {};
    const parts = [];

    for (const tc of msg.tool_calls ?? []) {
      const rawArgs = tc.function?.arguments ?? {};
      parts.push({
        functionCall: {
          id: generateClientFunctionCallId(),
          name: tc.function.name,
          args: typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs,
        },
      });
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }
    if (parts.length === 0) {
      parts.push({ text: '' });
    }

    yield { content: { role: 'model', parts }, turnComplete: true };
  }

  async connect() {
    throw new Error('Live streaming is not used in this workshop.');
  }
}

export function createLocalModel(options = {}) {
  return new OllamaLlm(options);
}

export const localModel = createLocalModel();

/**
 * Generates dense vectors via Ollama /api/embed (`embeddinggemma-2`).
 */
export async function embedTexts(texts) {
  const res = await fetch(`${OLLAMA_HOST}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, input: texts }),
  });

  if (!res.ok) {
    throw new Error(`Ollama /api/embed failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.embeddings;
}

export async function embedText(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}

export function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
