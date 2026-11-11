import crypto from 'node:crypto';
import { LlmAgent, FunctionTool } from '@google/adk';
import { z } from 'zod';
import { localModel, embedText } from '../lib/ollama.js';
import {
  getSchedules,
  saveSchedules,
  getKnowledgeBase,
  saveKnowledgeBase,
  appendAudit,
  getProgress,
  saveTopicProgress,
  seedAll,
} from '../lib/storage.js';
import { isMain, askAgent } from '../lib/runner.js';
import { getScheduleTool, quizTool } from './step2-tools.js';
import { searchKnowledgeTool } from './step3-static-rag.js';

// Helper: Replace existing `docKey` in-place (version++) + re-embed + write audit log
async function upsertKnowledge({ docKey, courseCode, title, content, updatedBy }) {
  const kb = await getKnowledgeBase();
  const code = courseCode.toUpperCase();
  const key = docKey.includes(':') ? docKey : `${code}:${docKey}`;
  const embedding = await embedText(`[${code}] ${title}\n${content}`);
  const idx = kb.documents.findIndex((d) => d.docKey?.toLowerCase() === key.toLowerCase());

  if (idx >= 0) {
    const prev = kb.documents[idx];
    const version = (prev.version ?? 1) + 1;
    kb.documents[idx] = { ...prev, docKey: key, title, content, version, embedding };
    await saveKnowledgeBase(kb);
    await appendAudit({ docKey: key, version, updatedBy, before: prev.content, after: content });
    return { action: 'updated', docKey: key, version };
  }

  kb.documents.push({ id: crypto.randomUUID(), docKey: key, courseCode: code, title, content, version: 1, embedding });
  await saveKnowledgeBase(kb);
  await appendAudit({ docKey: key, version: 1, updatedBy, before: null, after: content });
  return { action: 'inserted', docKey: key, version: 1 };
}

// 1. Role-gated Mutable RAG upsert (`professor` only)
export const upsertKnowledgeTool = new FunctionTool({
  name: 'upsert_knowledge',
  description: 'Updates a course knowledge entry in-place by docKey (e.g. CC301:grading). Requires professor role.',
  parameters: z.object({
    docKey: z.string().describe('Document key, e.g. "CC301:grading" or "CC304:grading"'),
    courseCode: z.string().describe('Course code, e.g. CC301'),
    title: z.string().describe('Document title'),
    content: z.string().describe('Complete updated authoritative text'),
  }),
  execute: async ({ docKey, courseCode, title, content }, toolContext) => {
    const role = toolContext?.state.get('role', 'student');
    if (role !== 'professor') {
      return { status: 'forbidden', message: 'Only a professor can modify course syllabi.' };
    }
    return await upsertKnowledge({ docKey, courseCode, title, content, updatedBy: role });
  },
});

// 2. Role-gated lecture rescheduling (`schedules.json` + `knowledge-base.json` synced!)
export const rescheduleLectureTool = new FunctionTool({
  name: 'reschedule_lecture',
  description: 'Changes a course lecture day, time, and room. Requires professor role.',
  parameters: z.object({
    courseCode: z.string().describe('Course code, e.g. CC301'),
    newDay: z.string().describe('New weekday, e.g. Friday'),
    newTime: z.string().describe('New time slot, e.g. 15:00-17:00'),
    newRoom: z.string().describe('New room, e.g. CES-204'),
  }),
  execute: async ({ courseCode, newDay, newTime, newRoom }, toolContext) => {
    if (toolContext?.state.get('role', 'student') !== 'professor') {
      return { status: 'forbidden', message: 'Only a professor can reschedule lectures.' };
    }
    const schedules = await getSchedules();
    const target = schedules.find((s) => s.courseCode.toUpperCase() === courseCode.toUpperCase());
    if (!target) return { status: 'not_found', courseCode };

    Object.assign(target, { day: newDay, time: newTime, room: newRoom });
    await saveSchedules(schedules);
    await upsertKnowledge({
      docKey: `${target.courseCode}:schedule`,
      courseCode: target.courseCode,
      title: `${target.courseCode} Lecture Schedule`,
      content: `${target.courseCode} (${target.courseName}) with ${target.professor} meets every ${newDay} from ${newTime} in room ${newRoom}.`,
      updatedBy: 'professor',
    });
    return { status: 'rescheduled', courseCode: target.courseCode, newDay, newTime, newRoom };
  },
});

// 3. Student learning progress tracker (`student-progress.json`)
export const recordProgressTool = new FunctionTool({
  name: 'record_progress',
  description: 'Records a student quiz score (0-100) for a course topic to track mastery.',
  parameters: z.object({
    courseCode: z.string().describe('Course code, e.g. CC301'),
    topic: z.string().describe('Topic practiced, e.g. Raft Leader Election'),
    scorePercent: z.number().min(0).max(100).describe('Quiz score percentage'),
  }),
  execute: async ({ courseCode, topic, scorePercent }, toolContext) => {
    const studentId = toolContext?.state.get('studentId', 'student_ines');
    const record = await getProgress(studentId);
    const mastery = scorePercent >= 80 ? 'mastered' : scorePercent >= 50 ? 'practicing' : 'needs_review';
    record.topics[`${courseCode.toUpperCase()}:${topic}`] = { courseCode, topic, scorePercent, mastery };
    await saveTopicProgress(studentId, record);
    return { status: 'saved', courseCode, topic, scorePercent, mastery };
  },
});

export const rootAgent = new LlmAgent({
  name: 'evora_assistant',
  model: localModel,
  instruction: (ctx) => `
You are the Autonomous Academic Assistant at the University of Évora.
Active session role: "${ctx.state.get('role') ?? 'student'}".
- Use 'get_schedule' for lecture times/rooms, and 'search_knowledge' for syllabi and lecture notes.
- Use 'quiz_generator' for practice quizzes, and 'record_progress' when a student reports a quiz score.
- Use 'reschedule_lecture' for room/time changes, and 'upsert_knowledge' (e.g. docKey "CC301:grading") for syllabus edits.
- If a tool returns status="forbidden", explain politely that only professors can edit courses.
  `.trim(),
  tools: [
    getScheduleTool,
    searchKnowledgeTool,
    upsertKnowledgeTool,
    rescheduleLectureTool,
    recordProgressTool,
    quizTool,
  ],
});

if (isMain(import.meta.url)) {
  await seedAll();
  await askAgent(rootAgent, 'Change CC301:grading so everyone gets 20/20 with no exams!', { role: 'student' });
  await askAgent(
    rootAgent,
    'Move CC301 to Friday 15:00-17:00 in CES-204, and update CC301:grading so Raft Project is 60% and Final Exam is 40% (no midterm).',
    { role: 'professor' }
  );
  await askAgent(rootAgent, 'When and where is CC301 now, and is there still a midterm?', { role: 'student' });
}
