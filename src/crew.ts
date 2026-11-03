/**
 * The Agent Crew: AegisRAG acted out by three small agents on one shared clock.
 * Positions are floor coordinates (x, z); times are seconds within the loop.
 */
export type Agent = {
  id: string
  name: string
  role: string
  maps: string
  color: string
  seed: number
  idleFacing: number
  path: [number, number, number][]
  says: { t0: number; t1: number; text: string; tone?: 'bad' | 'good' | 'warn' }[]
  carry: { t0: number; t1: number; color: string }[]
}

export const LOOP = 40

const LIB = { x: -4.0, z: -3.75 }
const RACK = { x: -5.45, z: -1.0 }
const WALL = { x: 0.25, z: -3.55 }

export const CREW: Agent[] = [
  {
    id: 'mallory',
    name: 'Mallory',
    role: 'Red team · PWWS attack',
    maps: 'The attacker. Rewrites a passage with WordNet synonyms until a DistilBERT surrogate flips its label, then slips it back into the knowledge base.',
    color: '#ff5c7a',
    seed: 1,
    idleFacing: 0.6,
    path: [
      [0, -5.3, 3.4],
      [4, RACK.x, RACK.z],
      [7, RACK.x, RACK.z],
      [11, LIB.x - 0.55, LIB.z],
      [14, LIB.x - 0.55, LIB.z],
      [19, -5.3, 3.4],
    ],
    says: [
      { t0: 0.5, t1: 3.5, text: 'Nobody watches the knowledge base…' },
      { t0: 4, t1: 7, text: 'PWWS: “implants” → “engraft”', tone: 'bad' },
      { t0: 11, t1: 14, text: 'Slipped into backdoor.md §2', tone: 'bad' },
      { t0: 26, t1: 29, text: 'Caught again?!' },
    ],
    carry: [{ t0: 5, t1: 11.5, color: '#ff5c7a' }],
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Retriever + generator',
    maps: 'The RAG pipeline. Embeds the question with all-MiniLM-L6-v2, pulls the top-3 passages from Qdrant and drafts an answer with gpt-4o-mini.',
    color: '#8fb3ff',
    seed: 2,
    idleFacing: 0,
    path: [
      [0, -0.9, 3.3],
      [12, -0.9, 3.3],
      [14.5, -0.8, -1.9],
      [16.5, LIB.x + 0.3, LIB.z],
      [19, LIB.x + 0.3, LIB.z],
      [22.5, WALL.x, WALL.z],
      [31, WALL.x, WALL.z],
      [33, -0.8, -1.9],
      [35.5, -0.9, 3.3],
    ],
    says: [
      { t0: 9, t1: 12.5, text: 'Q: how does a backdoor keep access?' },
      { t0: 16.5, t1: 19, text: 'Retrieve top-3 · cos 0.66' },
      { t0: 22.5, t1: 25, text: 'Draft: “…engraft malicious package…”', tone: 'warn' },
      { t0: 29.5, t1: 32, text: 'Re-ask + MITRE T1547 → grounded ✓', tone: 'good' },
    ],
    carry: [
      { t0: 17.5, t1: 26.5, color: '#c98a8f' },
      { t0: 29.5, t1: 35.5, color: '#3ddc97' },
    ],
  },
  {
    id: 'warden',
    name: 'Warden',
    role: 'Runtime monitor · φ1–φ3',
    maps: 'The runtime-verification monitor. Checks every answer against SHA-256-pinned MITRE data, quarantines the passage that misled it, and never lets it back in.',
    color: '#3ddc97',
    seed: 3,
    idleFacing: -0.4,
    path: [
      [0, 2.1, -3.2],
      [24.5, 2.1, -3.2],
      [26, WALL.x + 0.7, WALL.z + 0.15],
      [30, WALL.x + 0.7, WALL.z + 0.15],
      [32, 2.1, -3.2],
    ],
    says: [
      { t0: 2, t1: 6, text: 'Watching every answer.' },
      { t0: 25, t1: 27, text: 'φ1 violated: “engraft” ∉ MITRE', tone: 'bad' },
      { t0: 27, t1: 29.5, text: 'Quarantine backdoor.md §2', tone: 'warn' },
      { t0: 32.5, t1: 36, text: 'φ3: G(quarantined → G ¬inContext)', tone: 'good' },
    ],
    carry: [{ t0: 26.5, t1: 30, color: '#ff5c7a' }],
  },
]

export const ACTS = [
  { t: 0, title: 'The attack', text: 'Mallory takes a passage from the knowledge base and rewrites it with PWWS. It still reads almost normally.' },
  { t: 9, title: 'A question', text: 'A user asks about backdoor persistence. Scout retrieves the top-3 passages, and the poisoned one is among them.' },
  { t: 22.5, title: 'The draft', text: 'Scout drafts an answer that repeats the poisoned phrase, “engraft malicious package”.' },
  { t: 25, title: 'The monitor', text: 'Warden checks φ1: a rare word copied from a passage that MITRE never uses. Violation. The passage is quarantined.' },
  { t: 29.5, title: 'Recovery', text: 'Scout re-asks with the trusted MITRE ATT&CK entry. The answer is grounded, and φ3 keeps the poison out for good.' },
]

const start = typeof performance !== 'undefined' ? performance.now() : 0
export const crewTime = () => (((performance.now() - start) / 1000) % LOOP)
