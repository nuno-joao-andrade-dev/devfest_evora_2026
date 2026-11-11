import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { INITIAL_SCHEDULES, INITIAL_DOCS } from './seed-data.js';
import { embedTexts } from './ollama.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');

async function readJson(filename, fallback) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filename, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    'utf8'
  );
}

export async function getSchedules() {
  const existing = await readJson('schedules.json', null);
  if (existing) return existing;
  await writeJson('schedules.json', INITIAL_SCHEDULES);
  return structuredClone(INITIAL_SCHEDULES);
}

export async function saveSchedules(schedules) {
  await writeJson('schedules.json', schedules);
}

export async function getKnowledgeBase() {
  const existing = await readJson('knowledge-base.json', null);
  if (existing && Array.isArray(existing.documents) && existing.documents.length > 0) {
    return existing;
  }
  return await seedKnowledgeBase();
}

export async function saveKnowledgeBase(kb) {
  await writeJson('knowledge-base.json', kb);
}

export async function seedKnowledgeBase() {
  const vectors = await embedTexts(
    INITIAL_DOCS.map((d) => `[${d.courseCode}] ${d.title}\n${d.content}`)
  );
  const now = new Date().toISOString();
  const kb = {
    documents: INITIAL_DOCS.map((doc, i) => ({
      id: crypto.randomUUID(),
      docKey: doc.docKey,
      courseCode: doc.courseCode,
      title: doc.title,
      content: doc.content,
      version: 1,
      updatedAt: now,
      embedding: vectors[i],
    })),
  };
  await writeJson('knowledge-base.json', kb);
  return kb;
}

export async function appendAudit(entry) {
  const logs = await readJson('mutation-audit.json', []);
  logs.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  await writeJson('mutation-audit.json', logs);
}

export async function getAuditLog(limit = 5) {
  const logs = await readJson('mutation-audit.json', []);
  return logs.slice(-limit).reverse();
}

export async function getProgress(studentId = 'student_ines') {
  const all = await readJson('student-progress.json', {});
  return all[studentId] ?? { studentId, topics: {} };
}

export async function saveTopicProgress(studentId, record) {
  const all = await readJson('student-progress.json', {});
  all[studentId] = record;
  await writeJson('student-progress.json', all);
}

export async function seedAll() {
  await writeJson('schedules.json', INITIAL_SCHEDULES);
  await writeJson('mutation-audit.json', []);
  await writeJson('student-progress.json', {});
  const kb = await seedKnowledgeBase();
  return kb.documents.length;
}
