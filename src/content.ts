/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ROOM: all content lives here.
 *
 *  Anything that starts with "✎" is a placeholder, and the UI shows it with a
 *  dashed outline. Files go in /public (papers/, cv/, photos/) and are
 *  referenced without a leading slash, e.g. "papers/aegisrag.pdf".
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Link = { label: string; href: string }

export type Kind = 'paper' | 'notes' | 'reference' | 'project' | 'security' | 'experience' | 'achievement' | 'idea'

export type Item = {
  id: string
  title: string
  shelf: ShelfId
  kind: Kind
  year: string
  subtitle?: string
  body: string
  points?: string[]
  tags: string[]
  authors?: string
  venue?: string
  /** page count; page images live at papers/<pdf-name>-p-N.jpg */
  pages?: number
  pdf?: string
  links?: Link[]
  color: string
}

export type ShelfId = 'research' | 'security' | 'builds' | 'markets' | 'curious'

export const shelves: Record<ShelfId, { label: string; blurb: string }> = {
  research: { label: 'Research', blurb: 'AegisRAG: poisoning, detection and runtime verification.' },
  security: { label: 'Red Team', blurb: 'Hack The Box, TryHackMe and things I broke on purpose.' },
  builds: { label: 'Things I Built', blurb: 'Systems, tools and products, from brief to launch.' },
  markets: { label: 'Markets & ML', blurb: 'Adaptive models, trading research and on-chain risk.' },
  curious: { label: 'Ideas & Curiosities', blurb: 'Papers I want to write, and things I can’t stop thinking about.' },
}

export const KIND_LABEL: Record<Kind, string> = {
  paper: 'Paper',
  notes: 'Lab notes',
  reference: 'Built on',
  project: 'Project',
  security: 'Security',
  experience: 'Experience',
  achievement: 'Achievement',
  idea: 'Idea',
}

const BLOG = 'https://aliyousefi9403.github.io'
const PRIVATE = { label: 'Walkthrough on request', href: 'mailto:yousefi.ali@icloud.com?subject=Walkthrough%20request' }

export const profile = {
  name: 'Ali Yousefi',
  role: 'AI Security · Applied AI',
  location: 'London, UK',
  photo: 'photos/profile.jpg',
  bio: [
    'Final-year Computer Science student at City St George’s, University of London, focused on AI security and applied AI.',
    'My lead project is AegisRAG, research on detecting knowledge-base poisoning in RAG systems, which I’ve written up as a preprint with Dr Hafizul Asad and Dr Nikos Komninos. Alongside it I’m on the Hack The Box AI Red Teamer path and studying for CompTIA Security+.',
    'I’m an AI Engineering Intern at Adaptive Swarm, and I speak English and Turkish fluently and Persian natively.',
  ],
  email: 'yousefi.ali@icloud.com',
  cvUrl: 'cv/Ali_Yousefi_CV.pdf',
  cvImage: 'cv/cv-page-1.png',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ali-yousefi-6806b3268/' },
    { label: 'Research blog', href: BLOG },
    { label: 'GitHub', href: 'https://github.com/Aliyousefi9403' },
  ] as Link[],
  education: [
    { what: 'BSc (Hons) Computer Science', where: 'City St George’s, University of London', when: '2024 to 2027 · predicted 2:1 or above' },
  ],
  experience: [
    { what: 'AI Engineering Intern', where: 'Adaptive Swarm', when: '2026 to present' },
    { what: 'Blockchain Security & Market Analyst', where: 'Batis Group', when: '2025 to May 2026' },
    { what: 'Freelance Web Developer · Int’l B2B Sales', where: 'Kaveh Float', when: '2022 to 2025' },
  ],
  skills: ['LLM red teaming', 'RAG adversarial testing', 'Python', 'FastAPI', 'Qdrant', 'Next.js', 'DuckDB', 'AWS', 'Docker', 'C#', 'Java', 'Wireshark', 'gobuster'],
  rightToWork: 'Eligible for a placement year now, and for the UK Graduate visa (18 months, no sponsorship) after graduating in 2027.',
}

// ── The library ──────────────────────────────────────────────────────────────
export const items: Item[] = [
  // Research
  {
    id: 'aegisrag',
    title: 'Reading the Poison',
    subtitle: 'Relative-Entropy Detection of Word-Substitution Poisoning in a Cybersecurity RAG Knowledge Base',
    shelf: 'research',
    kind: 'paper',
    year: '2026',
    authors: 'Ali Yousefi, Hafizul Asad and Nikos Komninos',
    venue: 'Preprint · arXiv submission · City St George’s, University of London',
    body: 'In a RAG system the knowledge base is part of what has to be trusted. We study an attacker who edits existing passages by swapping words for synonyms (PWWS, TextFooler) in a small cybersecurity RAG system built from MITRE ATT&CK and CAPEC. Poisoning lowered judged answer correctness from 0.714 to 0.555, mostly through lost evidence and refusals rather than false statements. A single term of the relative entropy, the log-ratio between a word and its most probable synonym, reached an AUROC of 0.95 with a small language model as reference, while staying near chance on a layout-only control. An attacker that also had to keep each passage as probable under the language model did not succeed on any of 57 sections. A runtime monitor with a quarantine memory reduced exposure to edited text from 0.41 to 0.26; allowed to add the trusted MITRE entry, correctness rose to 0.786.',
    points: [
      'Synonym-swap poisoning cuts answer correctness by 22% (0.714 → 0.555), mainly by displacing evidence.',
      'The synonym-gap detector reaches 0.95 AUROC and names the swapped word it suspects.',
      'Filtering halves poisoned text reaching the generator (41% → 20%).',
      'A likelihood-constrained adaptive attacker succeeded on 0 of 57 sections.',
      'Runtime monitor: exposure 0.41 → 0.26; with the trusted MITRE fallback, correctness 0.786.',
    ],
    tags: ['RAG poisoning', 'relative entropy', 'adversarial text', 'runtime verification'],
    pages: 7,
    pdf: 'papers/aegisrag.pdf',
    links: [{ label: 'The blog series', href: BLOG }],
    color: '#7a2230',
  },
  {
    id: 'aegis-rv',
    title: 'The Monitor That Remembers',
    subtitle: 'AegisRAG, part II: runtime verification (paper §V-G)',
    shelf: 'research',
    kind: 'paper',
    year: '2026',
    body: 'Filters forget, and they throw away the evidence with the poison. This part of AegisRAG checks every answer against SHA-256-pinned MITRE data before the user sees it, using three temporal rules, and remembers the passages that misled it.',
    points: ['Exposure to edited text 41% → 26% (PWWS), 82% → 58% (TextFooler).', 'Wrong answers 2 → 0.', 'With a trusted MITRE fallback, correctness 0.786 and refusals 45 → 7.'],
    tags: ['LTL', 'monitors', 'MITRE ATT&CK'],
    pages: 7,
    pdf: 'papers/aegisrag.pdf',
    color: '#1d4a5a',
  },
  { id: 'note-1', title: 'Lab Notes I', subtitle: 'Choosing RAG poisoning', shelf: 'research', kind: 'notes', year: 'Jul 2026', body: 'How a reading list of nine IEEE papers turned a coursework project into a research question, and the gap it targets.', tags: ['journal'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-1-choosing-a-dissertation-topic/` }], color: '#3b3f4a' },
  { id: 'note-2', title: 'Lab Notes II', subtitle: 'The baseline RAG', shelf: 'research', kind: 'notes', year: 'Jul 2026', body: 'Qdrant, all-MiniLM-L6-v2 and LangChain: the first end-to-end retrieval pipeline and the decisions behind it.', tags: ['journal'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-1-building-the-baseline-rag/` }], color: '#41454f' },
  { id: 'note-3', title: 'Lab Notes III', subtitle: 'The full pipeline', shelf: 'research', kind: 'notes', year: 'Aug 2026', body: 'A source-first knowledge base from MITRE ATT&CK and CAPEC STIX data, a FastAPI + Next.js stack, and a working PWWS attack.', tags: ['journal'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-2-milestone-full-rag-pipeline/` }], color: '#383c46' },
  { id: 'note-4', title: 'Lab Notes IV', subtitle: 'From demo to paper', shelf: 'research', kind: 'notes', year: 'Nov 2026', body: 'Three months in: the experiment, the attack, the detector, the adaptive attackers and the monitor.', tags: ['journal'], links: [{ label: 'Read the post', href: `${BLOG}/posts/three-months-in-from-a-rag-demo-to-a-paper/` }], color: '#444852' },
  { id: 'ref-1', title: 'RAG-Targeted Adversarial Attack', subtitle: 'Ikbarieh, Aryal & Gupta · IEEE BigData 2025', shelf: 'research', kind: 'reference', year: '2025', body: 'The paper AegisRAG builds on. It shows word-level edits to a RAG knowledge base degrade LLM security advice, and leaves defences as future work.', tags: ['reference'], color: '#8a7a5a' },
  { id: 'ref-2', title: 'PWWS', subtitle: 'Ren et al. · ACL 2019', shelf: 'research', kind: 'reference', year: '2019', body: 'Probability Weighted Word Saliency: the synonym-substitution attack used to poison the knowledge base.', tags: ['reference'], links: [{ label: 'ACL Anthology', href: 'https://aclanthology.org/P19-1103/' }], color: '#7b6d50' },

  // Red team
  { id: 'htb', title: 'Hack The Box', subtitle: 'AI Red Teamer path · primary focus', shelf: 'security', kind: 'security', year: 'due Jan 2027', body: 'Practising prompt injection, data poisoning and output manipulation against LLM systems. It feeds directly into AegisRAG.', tags: ['prompt injection', 'data poisoning', 'LLM red teaming'], color: '#2f6b2a' },
  { id: 'secplus', title: 'CompTIA Security+', subtitle: 'SY0-701 · in progress', shelf: 'security', kind: 'security', year: 'due Jan 2027', body: 'The broad foundation: threats, architecture, operations and governance.', tags: ['certification'], color: '#9b2a2a' },
  { id: 'thm-red', title: 'TryHackMe Red Teaming', subtitle: 'In progress · Cyber Security 101 completed', shelf: 'security', kind: 'security', year: '2026', body: 'Completed the Cyber Security 101 path plus web and cloud exploitation rooms; the Red Teaming path is in progress.', tags: ['offensive security'], color: '#a3262d' },
  { id: 'git-leak', title: 'The Exposed .git', subtitle: 'Web exploitation write-up', shelf: 'security', kind: 'security', year: '2026', body: 'Found an exposed .git directory on a Flask host with gobuster, then rebuilt the application source from loose git objects.', tags: ['gobuster', 'git forensics', 'web'], color: '#3b3f2a' },
  { id: 'cognito', title: 'Anonymous to DynamoDB', subtitle: 'Cloud exploitation write-up', shelf: 'security', kind: 'security', year: '2026', body: 'Abused an AWS Cognito identity pool that issued credentials to anonymous users, and used them to enumerate an over-permissive DynamoDB table.', tags: ['AWS', 'Cognito', 'IAM'], color: '#a26a1f' },
  { id: 'rugpull', title: 'Rug-Pull Screening', subtitle: 'Batis Group · Blockchain Security & Market Analyst', shelf: 'security', kind: 'experience', year: '2025–26', body: 'Screened Ethereum and Tron tokens for rug-pull risk by checking ownership, mint rights, liquidity locks and holder spread. I also owned the company’s wallet and key management, and redesigned storage and recovery to remove single points of failure.', tags: ['Ethereum', 'Tron', 'Slither', 'key management'], color: '#4a3a7a' },

  // Builds
  { id: 'nightwatch', title: 'Night Watch', subtitle: 'An autonomous mini-SOC run by three agents', shelf: 'builds', kind: 'project', year: '2026', body: 'The robots in this room. Three agents defend the room’s own network in real time: Sentry watches the event stream, Analyst correlates detections into incidents mapped to MITRE ATT&CK, and Medic contains the threat. You can launch the attacks yourself.', tags: ['multi-agent', 'detection engineering', 'MITRE ATT&CK'], color: '#1f5f8b' },
  { id: 'room', title: 'The Room', subtitle: 'This interactive 3D portfolio', shelf: 'builds', kind: 'project', year: '2026', body: 'The place you are standing in. A 3D room built from scratch in the browser with React Three Fiber and TypeScript, where every object is a project you can use: a live market desk, a page-flip paper reader, a qubit you can measure, a working mini-SOC with three agents, and a hoop with real ball physics.', points: ['11 stations; all geometry and textures generated in code, so there are no model downloads.', 'Live BTC/ETH over a Coinbase websocket, with indicators computed client-side.', 'Night Watch: sliding-window detection rules mapped to MITRE ATT&CK, incident correlation, A* navigation for the agents.'], tags: ['React Three Fiber', 'TypeScript', 'WebGL'], links: [{ label: 'Source on GitHub', href: 'https://github.com/Aliyousefi9403/3D-Room' }], color: '#8a6a2f' },
  { id: 'courtvision', title: 'CourtVision', subtitle: 'Live basketball match analyser', shelf: 'builds', kind: 'project', year: '', body: 'A machine-learning system that watches a basketball game live: it tracks every player, recognises who each one is, and understands what they are doing on each possession. After the game it analyses every player individually, and the team they’re about to face, and turns that into a plan: how to play them and what to do.', points: ['Multi-person tracking with player re-identification across the whole game.', 'Action understanding per player, possession by possession.', 'Post-game reports per player, plus opponent scouting with tactical recommendations.'], tags: ['computer vision', 'tracking', 'machine learning', 'basketball'], links: [PRIVATE], color: '#c4571a' },
  { id: 'lease', title: 'Lease & Contract Analyser', subtitle: 'Retrieval-augmented legal analysis', shelf: 'builds', kind: 'project', year: '2026', body: 'A RAG pipeline that splits tenancy agreements into clauses and maps each one to the governing statute.', points: ['Flags non-standard, missing and unenforceable terms.', 'Reports accuracy against a hand-labelled test set.', 'Scoped in data-retention controls and a clear line between analysis and regulated legal advice.'], tags: ['RAG', 'embeddings', 'LLM APIs'], links: [PRIVATE], color: '#5a4a3a' },
  { id: 'aris', title: 'Aris', subtitle: 'Voice & gesture controlled system supervisor', shelf: 'builds', kind: 'project', year: '2026', body: 'A local assistant with a FastAPI WebSocket backend, a SQLite indexer over 12 git repos, and a voice and gesture UI built on MediaPipe.', points: ['Tool layer restricted by a repository allowlist and command blocklist, so every action stays inside the sandbox.', 'OAuth 2.0 with rotating refresh tokens. Traced a 403 to header filtering and a TLS failure to a missing trust store.'], tags: ['FastAPI', 'WebSockets', 'MediaPipe', 'OAuth 2.0'], links: [PRIVATE], color: '#2b4f6b' },
  { id: 'studio', title: 'BreachLab', subtitle: 'Animated cybersecurity explainers on YouTube', shelf: 'builds', kind: 'project', year: '2026', body: 'I write, code and animate BreachLab: 2D explainers that turn real attacks into short stories, from a £1,500 parking-QR scam to a $25 million deepfake video call, and show how to stop them. The Studio TV in this room plays the real episodes.', points: ['Long-form explainers: QR-code phishing, and four ways attackers get past 2FA.', 'Shorts on real incidents, hosted by a duck who has never been caught.', 'Every frame animated in code.'], tags: ['animation', 'security education', 'YouTube'], links: [{ label: 'Watch on YouTube', href: 'https://www.youtube.com/@Breachlab101' }], color: '#b5372f' },
  { id: 'pharmacy', title: 'Pharmacy Ordering System', subtitle: 'Team project · Project Manager', shelf: 'builds', kind: 'project', year: '2026', body: 'Led requirements, design and sprint planning as Project Manager, and co-wrote the C# front end and JWT-secured REST API.', tags: ['C#', 'REST', 'MySQL', 'JWT'], color: '#2d5a50' },
  { id: 'farazjam', title: 'farazjam.com', subtitle: 'Freelance web development', shelf: 'builds', kind: 'experience', year: '2022–25', body: 'Delivered two business websites from brief to launch as sole point of contact. Alongside it, closed four international B2B deals across Italy, Germany, China and the Middle East for Kaveh Float, negotiating in a second language.', tags: ['web', 'sales'], links: [{ label: 'farazjam.com', href: 'https://farazjam.com' }], color: '#6b5a2a' },

  // Markets
  { id: 'swarm', title: 'Adaptive Swarm', subtitle: 'AI Engineering Intern · 2026 to present', shelf: 'markets', kind: 'experience', year: '2026–', body: 'I work with Adaptive Swarm’s self-improving, self-adaptive model platform for financial markets. I built a model for understanding and predicting Bitcoin from a set of technical indicators.', points: ['Develop and evaluate models on a node-based adaptive AI platform, from data ingestion to signals scored on live markets.', 'Give the founders structured feedback as an early engineering user, which earned me full access to the model and data layer.'], tags: ['Bitcoin', 'indicators', 'adaptive models'], color: '#5d4790' },
  { id: 'quantdesk', title: 'quantdesk', subtitle: 'Systematic trading research stack', shelf: 'markets', kind: 'project', year: '2026', body: 'The research harness: an exchange data layer, a DuckDB + Parquet store, a cost model, a backtester and walk-forward tests.', points: ['Multi-asset trend strategy with inverse-volatility sizing and portfolio volatility targeting, rebalanced weekly.', 'Chose rules over machine learning given too few independent market regimes, using walk-forward splits to expose overfitting.'], tags: ['DuckDB', 'Parquet', 'backtesting'], links: [PRIVATE], color: '#2d5a3d' },

  // Curiosities & ideas
  { id: 'quantum', title: 'Quantum Physics', subtitle: 'A long-running obsession', shelf: 'curious', kind: 'achievement', year: '∞', body: 'Superposition, measurement and the strange fact that the universe keeps its options open until you look. There’s a qubit on the side table you can measure yourself.', tags: ['Bloch sphere', 'measurement'], color: '#3a3f8a' },
  { id: 'tesla', title: 'Nikola Tesla', subtitle: 'My favourite character of all time', shelf: 'curious', kind: 'achievement', year: '1856–1943', body: 'Reading the life of Nikola Tesla is one of my favourite things I’ve ever done. Alternating current, the induction motor, wireless power, hundreds of patents, and a mind that built machines in his head before he built them in metal. He’s my favourite character of all time. Click the coil in the Quantum Corner.', tags: ['Tesla', 'invention'], links: [{ label: 'My Inventions (1919)', href: 'https://en.wikipedia.org/wiki/My_Inventions:_The_Autobiography_of_Nikola_Tesla' }, { label: 'His writings, free', href: 'https://www.gutenberg.org/ebooks/39272' }], color: '#2a4a6a' },
  { id: 'reading', title: 'How I Got Into Quantum', subtitle: 'The books and papers that did it', shelf: 'curious', kind: 'achievement', year: '', body: 'I got into quantum physics by reading. Feynman’s QED made light strange, Hawking’s A Brief History of Time made the universe feel small enough to think about, and Rovelli’s Helgoland made the measurement problem impossible to stop thinking about. Then the originals: the 1935 EPR paper and Bell’s 1964 reply.', points: ['Richard Feynman, QED: The Strange Theory of Light and Matter', 'Stephen Hawking, A Brief History of Time', 'Carlo Rovelli, Helgoland', 'Einstein, Podolsky & Rosen (1935), Can Quantum-Mechanical Description of Physical Reality Be Considered Complete?', 'John S. Bell (1964), On the Einstein Podolsky Rosen Paradox'], tags: ['quantum', 'reading'], links: [{ label: 'The EPR paper', href: 'https://journals.aps.org/pr/abstract/10.1103/PhysRev.47.777' }], color: '#4a3a8a' },
  { id: 'ukmt', title: 'UKMT Senior Challenge', subtitle: 'Silver · Senior Kangaroo Certificate of Merit', shelf: 'curious', kind: 'achievement', year: '2022', body: 'UK Mathematics Trust Senior Mathematical Challenge Silver award and Senior Kangaroo Certificate of Merit.', tags: ['mathematics'], color: '#7a5a1f' },
  { id: 'idea-memory', title: 'Poisoning Agent Memory', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'Long-term memory in LLM agents is a corpus the attacker can write to. How long does one poisoned memory persist, and how far does it spread?', tags: ['agents', 'memory'], color: '#3a2a2e' },
  { id: 'idea-xling', title: 'Cross-Lingual Poisoning', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'Do poisoned passages written in Persian or Turkish hijack answers to English questions? Multilingual embedders make it likely, and it’s under-studied.', tags: ['multilingual', 'RAG'], color: '#3a2a2e' },
  { id: 'idea-rvtrade', title: 'Monitors for Trading Agents', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'Bridges quantdesk and AegisRAG: position limits and wash-trade rules as runtime monitors over an agent’s order flow.', tags: ['compliance', 'LTL'], color: '#20343c' },
  { id: 'idea-news', title: 'Adversarial News for Trading Bots', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'RAG poisoning meets markets: can a fake press release steer an agentic trader?', tags: ['security', 'markets'], color: '#233d2c' },
  { id: 'idea-qml', title: 'Quantum Kernels for Regimes', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'Can quantum kernel methods separate market regimes that classical kernels blur? A small, honest benchmark on simulators.', tags: ['quantum ML', 'markets'], color: '#2a2e4a' },
  { id: 'idea-shot', title: 'Shot Quality from Tracking', subtitle: 'Next paper idea', shelf: 'curious', kind: 'idea', year: '', body: 'An expected-points model for basketball shots from defender distance, shot clock and player history.', tags: ['basketball', 'xP'], color: '#4a3220' },
]

// ── Stations ─────────────────────────────────────────────────────────────────
export const ragLab = {
  title: 'AegisRAG: Poisoning a Security RAG',
  summary:
    'An attacker who can edit an existing knowledge base swaps words for synonyms until a classifier’s label flips. The text still reads almost normally (“implants malicious software” became “Engraft Malicious Package”), but answers to a cybersecurity question-answering system get measurably worse. I built the system, the attack, the benchmark and the defences.',
  setup: [
    { k: 'Corpus', v: '200 MITRE ATT&CK + CAPEC passages · 14 attack types' },
    { k: 'Stack', v: 'Python · FastAPI · LangChain · Qdrant · all-MiniLM-L6-v2 · gpt-4o-mini · Next.js' },
    { k: 'Benchmark', v: '44 reviewed questions × 3 runs per condition' },
    { k: 'Judge', v: 'LLM judge vs. my blind grades on 75 answers: weighted κ = 0.82' },
    { k: 'Integrity', v: '73 headline claims checked against 5,000 SHA-256-checksummed records · 285 tests' },
  ],
  results: [
    { label: 'Clean', correctness: 0.714 },
    { label: 'Poisoned (PWWS)', correctness: 0.555 },
    { label: '+ Monitor', correctness: 0.515 },
    { label: '+ Monitor + MITRE fallback', correctness: 0.786 },
  ],
  detectors: [
    { name: 'Synonym gap · distilgpt2 reference', pwws: 0.95, control: 0.53 },
    { name: 'Windowed perplexity (top-5)', pwws: 0.91, control: 0.56 },
    { name: 'Synonym gap · word frequency', pwws: 0.82, control: 0.67 },
    { name: 'Whole-passage perplexity', pwws: 0.77, control: 0.45 },
    { name: 'Word-level KL vs. corpus', pwws: 0.72, control: 0.62 },
  ],
  findings: [
    'The attack works mostly by removing evidence, not by planting lies: refusals went 26 → 45 of 132, wrong answers only 0 → 2.',
    'The damage is local. Questions whose source section was edited dropped 0.682 → 0.432; the rest barely moved.',
    'One term of the KL divergence (how much likelier a word’s best synonym is) beats the whole sum, and names the swapped word in 22 of 27 flagged passages.',
    'A likelihood-constrained adaptive attacker succeeded on 0 of 57 sections.',
    'Filtering makes the knowledge base safer, not more useful. Getting answers back needs a trusted source.',
  ],
  links: [
    { label: 'Read the paper', href: '#read:aegisrag' },
    { label: 'Download PDF', href: 'papers/aegisrag.pdf' },
    { label: 'The blog series', href: BLOG },
    PRIVATE,
  ] as Link[],
}

export const rv = {
  title: 'AegisRAG II: The Runtime Monitor',
  summary:
    'The second half of AegisRAG. Filters forget, and they throw away the evidence with the poison. Following Dr Hafizul Asad’s suggestion, I added runtime verification: every answer is checked against rules before the user sees it, violations are fed back, and the passages that caused them are remembered.',
  rules: [
    { id: 'φ1', name: 'No strange words', text: 'The answer must not contain a rare word (Zipf < 3.5) copied from the retrieved passages that is not in MITRE’s vocabulary or the question.' },
    { id: 'φ2', name: 'Don’t give up wrongly', text: 'The answer must not be a refusal when MITRE covers the attack being asked about.' },
    { id: 'φ3', name: 'Never trust again', text: 'G(quarantined(p) → G ¬inContext(p)): once quarantined, a passage never reaches the model again.' },
  ],
  numbers: [
    { k: 'Edited text reaching the model (PWWS)', v: '41% → 26%' },
    { k: 'Edited text reaching the model (TextFooler)', v: '82% → 58%' },
    { k: 'Wrong answers (PWWS)', v: '2 → 0' },
    { k: 'Correctness with MITRE fallback', v: '0.786' },
    { k: 'Refusals with MITRE fallback', v: '45 → 7' },
  ],
  honest: [
    'The first φ1 flagged words the model chose itself and wrongly withheld 10 answers. I fixed it to count only copied words and re-ran the full experiment; both runs are kept.',
    'Blame is rough: on PWWS only 10 of the 18 quarantined passages were actually edited.',
    'The fallback beats the clean system only because it adds trusted text. It shows what a trusted source can add, not what detection can.',
  ],
  links: [{ label: 'Read the paper (§V-G)', href: '#read:aegis-rv' }, { label: 'The blog series', href: BLOG }] as Link[],
  learned: 'A memory is only as good as the step that decides what to remember.',
}

export const quantDesk = {
  title: 'quantdesk',
  summary:
    'My systematic trading research stack. The screens on this desk are live: real Bitcoin and Ethereum prices streamed into your browser, with the indicators computed as each trade arrives.',
  parts: [
    { name: 'Data layer', does: 'Exchange REST APIs into a DuckDB + Parquet store' },
    { name: 'Cost model', does: 'Fees and slippage charged on every simulated fill' },
    { name: 'Backtester', does: 'Event-driven, weekly rebalance' },
    { name: 'Walk-forward', does: 'Rolling out-of-sample splits to expose overfitting' },
    { name: 'Strategy', does: 'Multi-asset trend, inverse-volatility sizing, portfolio vol targeting' },
  ],
  why: 'I chose rules over machine learning because there are too few independent market regimes to train on honestly. Walk-forward splits are there to catch me if I fool myself.',
  stack: ['Python', 'DuckDB', 'Parquet', 'exchange REST APIs'],
  links: [PRIVATE] as Link[],
}

export const internship = {
  company: 'Adaptive Swarm',
  role: 'AI Engineering Intern',
  when: '2026 to present',
  summary:
    'Adaptive Swarm builds a self-improving, self-adaptive AI platform for financial markets, in which models are assembled from nodes that keep adapting as the market changes. On it, I built a model for understanding and predicting Bitcoin from a set of technical indicators.',
  pipeline: [
    { k: 'Ingest', v: 'Live BTC market data' },
    { k: 'Indicators', v: 'Trend, momentum, volatility and volume features (EMA, RSI, MACD, Bollinger…)' },
    { k: 'Model', v: 'Adaptive nodes that re-weight as regimes shift' },
    { k: 'Signal', v: 'Scored on live markets' },
  ],
  did: [
    'Develop and evaluate models on the node-based platform, from data ingestion to signals scored on live markets.',
    'Built a Bitcoin model from technical indicators.',
    'Give the founders structured feedback as an early engineering user, which earned me full access to the model and data layer.',
  ],
  learned: [
    'Markets change regime, so a model that can’t adapt quietly decays. Adaptation has to be designed in, not bolted on.',
    'Live scoring is the only honest test. A backtest is a hypothesis.',
    'Most of the work is the data layer: clean ingestion and well-defined features matter more than a cleverer model.',
    'Feedback is a skill too: being a precise early user earned me full access to the platform.',
  ],
}

export const basketball = {
  headline: 'Basketball',
  jersey: '13',
  facts: [
    { k: 'National team', v: 'Iran U18' },
    { k: 'Title', v: 'Iran U21 National Champion' },
    { k: 'Jersey', v: '#13' },
    { k: 'Knees', v: 'ACL torn twice' },
  ],
  story: [
    'I wore number 13 for Iran’s under-18 national team, and I’m an Iran U21 national champion.',
    'I also tore my ACL. Twice. Each time it meant months of rehab: relearning to trust a knee, doing the same boring exercises every day, and watching my team play without me.',
    'That taught me more than any win. Leadership when you can’t lead by scoring. Being a teammate from the bench. Patience with slow progress. And the discipline to keep doing the unglamorous work when nobody is watching. It’s the same discipline that gets a research project finished.',
  ],
  learned: [
    { k: 'Leadership', v: 'Leading when you can’t lead by scoring.' },
    { k: 'Teamwork', v: 'Making the people around you better, even from the bench.' },
    { k: 'Resilience', v: 'Two ACL tears, two comebacks.' },
    { k: 'Discipline', v: 'Rehab is the same rep every day. So is research.' },
  ],
}

export const quantum = {
  title: 'Quantum Physics',
  summary:
    'I love quantum physics. A qubit is the simplest object that shows how strange it all is: until it’s measured it’s a point on a sphere, a weighted mix of 0 and 1, and measuring it forces a single answer with probabilities set by where it sat.',
  note: 'I got into it by reading: Feynman’s QED, Hawking’s A Brief History of Time, Rovelli’s Helgoland, then the EPR paper and Bell’s theorem. And Nikola Tesla, my favourite character of all time, is the reason there’s a coil in this corner.',
  reading: [
    { t: 'QED: The Strange Theory of Light and Matter', a: 'Richard Feynman' },
    { t: 'A Brief History of Time', a: 'Stephen Hawking' },
    { t: 'Helgoland', a: 'Carlo Rovelli' },
    { t: 'Can Quantum-Mechanical Description of Physical Reality Be Considered Complete?', a: 'Einstein, Podolsky & Rosen · 1935' },
    { t: 'On the Einstein Podolsky Rosen Paradox', a: 'John S. Bell · 1964' },
    { t: 'My Inventions', a: 'Nikola Tesla · 1919' },
  ],
}

export const studio = {
  title: 'BreachLab',
  summary:
    'BreachLab is my YouTube channel: 2D animated explainers I code myself, turning real attacks into short stories and showing how to stop them. The TV plays the real videos. Pick one below.',
  channel: 'https://www.youtube.com/@Breachlab101',
  videos: [
    { id: 'i7XOZuSWM0Q', t: '4 Ways Hackers Get Past 2FA (And How to Stop Them)', kind: 'video' },
    { id: 'CUodFDzJVd0', t: 'The QR Code Hack: How One Parking Scan Took £1,500', kind: 'video' },
    { id: '25FPeWUbwWc', t: 'One Video Call. $25 Million Gone. Every Face Was Fake.', kind: 'short' },
    { id: '0H0LxAAP-cg', t: 'He Hacked Uber By Being Annoying', kind: 'short' },
    { id: '46d-ak23a4Y', t: 'One Parking QR Scan Cost Her £1,500', kind: 'short' },
    { id: 'jYc8hYX24F8', t: 'He’s never been caught. Now he has to teach you.', kind: 'short' },
  ],
  links: [{ label: 'Subscribe on YouTube', href: 'https://www.youtube.com/@Breachlab101' }] as Link[],
}

export const view = {
  title: 'The View',
  summary:
    'London from my window. I moved here to study, and it’s where AegisRAG, the internship and most of my late nights happened. The skyline is drawn in layers, so it shifts as you move. Find the Shard, the Gherkin, the BT Tower and the Eye.',
}
