export const INITIAL_SCHEDULES = [
  {
    courseCode: 'CC301',
    courseName: 'Distributed Systems',
    professor: 'Prof. Luís Silva',
    day: 'Tuesday',
    time: '10:00-12:00',
    room: 'CES-131 (Colégio do Espírito Santo)',
    officeHours: 'Wednesday 14:30-16:00, Room CES-210',
  },
  {
    courseCode: 'CC304',
    courseName: 'Applied Local AI & Autonomous Agents',
    professor: 'Prof.ª Sofia Mendes',
    day: 'Thursday',
    time: '14:00-16:00',
    room: 'CES-124 (Colégio do Espírito Santo)',
    officeHours: 'Friday 11:00-12:30, Lab CES-Lab2',
  },
  {
    courseCode: 'CC208',
    courseName: 'Algorithms & Graph Theory',
    professor: 'Prof. Tiago Pereira',
    day: 'Monday',
    time: '09:00-11:00',
    room: 'CES-Aud1 (Sala dos Actos Annex)',
    officeHours: 'Tuesday 15:00-16:30, Room CES-118',
  },
];

export const INITIAL_DOCS = [
  {
    docKey: 'CC301:schedule',
    courseCode: 'CC301',
    title: 'CC301 Lecture Schedule',
    content:
      'CC301 (Distributed Systems) with Prof. Luís Silva meets every Tuesday from 10:00-12:00 in room CES-131 (Colégio do Espírito Santo). Office hours: Wednesday 14:30-16:00 in CES-210.',
  },
  {
    docKey: 'CC301:grading',
    courseCode: 'CC301',
    title: 'CC301 Grading Policy',
    content:
      'CC301 Distributed Systems grading: Practical Raft Project = 40%, Midterm Exam = 25%, Final Written Exam = 35%. Minimum project grade is 9.5/20.',
  },
  {
    docKey: 'CC301:raft',
    courseCode: 'CC301',
    title: 'CC301 Lecture Notes — Raft Leader Election',
    content:
      'In Raft, every node is a Follower, Candidate, or Leader. Followers expect periodic AppendEntries heartbeats. If a randomized election timeout (150-300ms) expires without a heartbeat, a Follower increments its term, becomes a Candidate, votes for itself, and requests votes. A majority quorum (N/2 + 1) elects the new Leader.',
  },
  {
    docKey: 'CC304:schedule',
    courseCode: 'CC304',
    title: 'CC304 Lecture Schedule',
    content:
      'CC304 (Applied Local AI & Autonomous Agents) with Prof.ª Sofia Mendes meets every Thursday from 14:00-16:00 in room CES-124 (Colégio do Espírito Santo).',
  },
  {
    docKey: 'CC304:grading',
    courseCode: 'CC304',
    title: 'CC304 Grading Policy',
    content:
      'CC304 Applied Local AI grading: Local Agent Repository = 50%, Live Offline Demo = 20%, Written Quiz = 30%.',
  },
  {
    docKey: 'CC304:mutable-rag',
    courseCode: 'CC304',
    title: 'CC304 Lecture Notes — Static vs. Mutable RAG',
    content:
      'Static RAG only appends chunks, leaving outdated facts in the index that collide during Top-K search. Mutable RAG assigns deterministic keys (docKey), replaces stale chunks in-place by re-embedding, increments version numbers, and enforces role checks with an audit log.',
  },
  {
    docKey: 'CC208:graphs',
    courseCode: 'CC208',
    title: 'CC208 Lecture Notes — Dijkstra vs. Bellman-Ford',
    content:
      'Dijkstra settles non-negative edge weights greedily in O((V + E) log V) time using a min-priority queue, failing on negative weights. Bellman-Ford relaxes all edges V - 1 times in O(V * E) time and handles negative weights safely.',
  },
];
