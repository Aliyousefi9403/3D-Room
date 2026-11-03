/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ROOM: all content lives here.
 *
 *  Anything that starts with "✎" is a placeholder for you to fill in. The UI
 *  shows placeholders with a dashed outline so you can spot them on the page.
 *
 *  Files: put PDFs in /public/papers and your CV in /public/cv, then point the
 *  `pdf` / `cvUrl` fields at them, e.g. "papers/rag-poisoning.pdf".
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Link = { label: string; href: string }

export type PaperStatus = 'published' | 'preprint' | 'in-progress' | 'notes' | 'read' | 'planned'

export type Paper = {
  id: string
  title: string
  shelf: ShelfId
  status: PaperStatus
  year: string
  venue?: string
  authors?: string
  abstract: string
  tags: string[]
  pdf?: string
  links?: Link[]
  /** spine colour */
  color: string
}

export type ShelfId = 'security' | 'formal' | 'markets' | 'agents' | 'sport'

export const shelves: Record<ShelfId, { label: string; blurb: string }> = {
  security: { label: 'AI Security', blurb: 'Attacking and defending retrieval-augmented systems.' },
  formal: { label: 'Formal Methods', blurb: 'Runtime verification and monitors for autonomous agents.' },
  markets: { label: 'Markets & ML', blurb: 'Quantitative finance, forecasting and learning systems.' },
  agents: { label: 'Multi-Agent Systems', blurb: 'Swarms, coordination and emergent behaviour.' },
  sport: { label: 'Sport Analytics', blurb: 'Where basketball meets data.' },
}

const BLOG = 'https://aliyousefi9403.github.io'
const GH = 'https://github.com/Aliyousefi9403'

export const profile = {
  name: 'Ali Yousefi',
  role: 'Computer Science · AI Security Research',
  tagline: 'Research, systems and basketball.',
  location: 'London, UK',
  photo: 'photos/profile.jpg',
  bio: [
    'I’m a final-year BSc Computer Science student at City St George’s, University of London.',
    'My dissertation, AegisRAG, studies how word-substitution attacks poison the knowledge base of a cybersecurity RAG system, and how to catch them with relative entropy and a runtime verification monitor. I’m preparing it as an arXiv preprint with my supervisors, Dr Hafizul Asad and Dr Nikos Komninos.',
    '✎ One sentence on what you’re looking for next (MSc, research role, internship…).',
  ],
  email: 'yousefi.ali@icloud.com',
  cvUrl: '✎ cv/Ali_Yousefi_CV.pdf',
  links: [
    { label: 'GitHub', href: GH },
    { label: 'Research blog', href: BLOG },
    { label: 'LinkedIn', href: '✎ https://linkedin.com/in/your-handle' },
  ] as Link[],
  education: [
    { what: 'BSc Computer Science', where: 'City St George’s, University of London', when: '✎ 20XX to 2027' },
  ],
  skills: ['Python', 'LangChain', 'Qdrant', 'RAG', 'Adversarial ML', 'Runtime verification', 'LTL', 'FastAPI', 'Next.js', 'Three.js'],
}

// ── Library ──────────────────────────────────────────────────────────────────
// Real work first. "notes" = blog posts, "read" = papers you built on,
// "planned" = ideas (ghosted spines). Promote ideas as you write them.
export const papers: Paper[] = [
  {
    id: 'aegisrag',
    title: 'Detecting and Mitigating Adversarial Poisoning in RAG-Based Cybersecurity Systems',
    shelf: 'security',
    status: 'in-progress',
    year: '2026',
    venue: 'arXiv preprint in preparation',
    authors: 'Ali Yousefi, with Dr Hafizul Asad and Dr Nikos Komninos',
    abstract:
      'Most RAG poisoning work injects new malicious passages. AegisRAG studies a quieter attack: editing passages that are already in the knowledge base by swapping words for synonyms (PWWS, TextFooler). On a cybersecurity RAG built from MITRE ATT&CK and CAPEC (18 documents, 200 passages, 14 attack types) with a reviewed 44-question benchmark, poisoning drops judged correctness from 0.714 to 0.555, mostly by removing evidence rather than planting misinformation. A contextual “synonym gap” detector, derived from one term of the KL divergence with a small language model as reference, reaches AUROC 0.95 on PWWS while staying near chance on a layout-only control. A likelihood-constrained adaptive attacker succeeds on 0 of 57 sections. Finally, a runtime-verification monitor with LTL rules and quarantine memory cuts exposure to edited text from 41% to 26%, and with a trusted MITRE fallback lifts correctness to 0.786.',
    tags: ['RAG poisoning', 'relative entropy', 'runtime verification', 'adversarial ML'],
    pdf: '✎ papers/aegisrag.pdf',
    links: [{ label: 'Code: AegisRAG', href: `${GH}/dissertation-RAG` }, { label: 'Research blog', href: BLOG }],
    color: '#7a2230',
  },
  {
    id: 'aegis-rv',
    title: 'A Runtime Monitor That Remembers What Fooled It',
    shelf: 'formal',
    status: 'in-progress',
    year: '2026',
    venue: 'AegisRAG, chapter on runtime verification',
    authors: 'Ali Yousefi',
    abstract:
      'Three rules checked on every answer before the user sees it, against SHA-256-pinned MITRE STIX data the attacker cannot edit. φ1: no rare words copied from retrieved passages that MITRE does not use. φ2: no refusal when MITRE covers the attack. φ3 (LTL): G(quarantined(p) → G ¬inContext(p)). Violations blame passages, write them to an append-only memory, and trigger at most two re-asks. Exposure to edited text drops 41% → 26% (PWWS) and 82% → 58% (TextFooler); with the trusted fallback, correctness reaches 0.786 and refusals fall from 45 to 7.',
    tags: ['LTL', 'runtime verification', 'monitors', 'MITRE ATT&CK'],
    links: [{ label: 'Code', href: `${GH}/dissertation-RAG` }],
    color: '#1d4a5a',
  },
  // Lab notebooks: your blog posts
  { id: 'note-1', title: 'Lab Notes I: Choosing RAG Poisoning', shelf: 'security', status: 'notes', year: 'Jul 2026', abstract: 'How a reading list of nine IEEE papers and one conversation turned a coursework project into a research question, and the gap it targets: Ikbarieh et al. leave defences as future work.', tags: ['journal'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-1-choosing-a-dissertation-topic/` }], color: '#3b3f4a' },
  { id: 'note-2', title: 'Lab Notes II: The Baseline RAG', shelf: 'security', status: 'notes', year: 'Jul 2026', abstract: 'Qdrant, all-MiniLM-L6-v2 and LangChain: the first end-to-end retrieval pipeline and the decisions behind it.', tags: ['journal', 'build'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-1-building-the-baseline-rag/` }], color: '#41454f' },
  { id: 'note-3', title: 'Lab Notes III: Full Pipeline', shelf: 'security', status: 'notes', year: 'Aug 2026', abstract: 'A source-first knowledge base built from MITRE ATT&CK and CAPEC STIX data, a FastAPI + Next.js stack, and a working PWWS attack.', tags: ['journal', 'milestone'], links: [{ label: 'Read the post', href: `${BLOG}/posts/week-2-milestone-full-rag-pipeline/` }], color: '#383c46' },
  { id: 'note-4', title: 'Lab Notes IV: From Demo to Paper', shelf: 'security', status: 'notes', year: 'Nov 2026', abstract: 'Three months in: the experiment, the attack, the detector, the adaptive attackers and the monitor, one paragraph each.', tags: ['journal', 'results'], links: [{ label: 'Read the post', href: `${BLOG}/posts/three-months-in-from-a-rag-demo-to-a-paper/` }], color: '#444852' },
  { id: 'note-5', title: 'Lab Notes V: Catching the Poison', shelf: 'formal', status: 'notes', year: 'Nov 2026', abstract: 'Why whole-passage KL divergence fails and how one term of the sum, the synonym gap, reaches AUROC 0.95.', tags: ['journal', 'detection'], links: [{ label: 'Research blog', href: BLOG }], color: '#2c3d44' },
  // Papers you built on
  { id: 'read-1', title: 'RAG-Targeted Adversarial Attack on LLM-Based Threat Detection', shelf: 'security', status: 'read', year: '2025', venue: 'IEEE BigData 2025', authors: 'Ikbarieh, Aryal & Gupta', abstract: 'The paper AegisRAG builds on: meaning-preserving word-level edits to a RAG knowledge base degrade LLM security recommendations. Defences are left as future work, which is the gap AegisRAG fills.', tags: ['reference'], color: '#8a7a5a' },
  { id: 'read-2', title: 'Generating Natural Language Adversarial Examples (PWWS)', shelf: 'security', status: 'read', year: '2019', venue: 'ACL 2019', authors: 'Ren, Deng, He & Che', abstract: 'Probability Weighted Word Saliency: the synonym-substitution attack used to poison the knowledge base.', tags: ['reference'], links: [{ label: 'ACL Anthology', href: 'https://aclanthology.org/P19-1103/' }], color: '#7b6d50' },
  { id: 'read-3', title: 'Is BERT Really Robust? (TextFooler)', shelf: 'security', status: 'read', year: '2020', venue: 'AAAI 2020', authors: 'Jin, Jin, Zhou & Szolovits', abstract: 'The second word-level attack evaluated against the detector and the monitor.', tags: ['reference'], links: [{ label: 'arXiv', href: 'https://arxiv.org/abs/1907.11932' }], color: '#6f6348' },

  // Systems write-ups (fill as you write them)
  { id: 'quant-agents', title: '✎ An Agentic Quant Fund', shelf: 'markets', status: 'in-progress', year: '✎', authors: 'Ali Yousefi', abstract: '✎ Write-up of the multi-agent quant fund: research, signal, risk and execution agents.', tags: ['multi-agent', 'trading'], color: '#2d5a3d' },
  { id: 'swarm-learning', title: '✎ Notes from Adaptive Swarm', shelf: 'agents', status: 'in-progress', year: '✎', authors: 'Ali Yousefi', abstract: '✎ A technical report on what you built and learned during the internship.', tags: ['swarm', 'ML', 'internship'], color: '#5d4790' },

  // ── Ideas: future books for the shelf (see README for the full list) ──────
  { id: 'idea-1', title: 'Cross-Lingual RAG Poisoning', shelf: 'security', status: 'planned', year: '', abstract: 'Do poisoned passages written in one language hijack answers to questions asked in another? Multilingual embedders make this likely and under-studied.', tags: ['multilingual', 'RAG'], color: '#3a2a2e' },
  { id: 'idea-2', title: 'Poisoning Agent Memory', shelf: 'security', status: 'planned', year: '', abstract: 'Long-term memory stores in agents are a RAG corpus the attacker can write to. Measure persistence and blast radius of a single poisoned memory.', tags: ['agents', 'memory'], color: '#3a2a2e' },
  { id: 'idea-3', title: 'Certified Retrieval Bounds', shelf: 'security', status: 'planned', year: '', abstract: 'How many poisoned passages can a top-k retriever tolerate before the answer flips? Provable bounds via isolate-then-aggregate.', tags: ['robustness', 'certification'], color: '#3a2a2e' },
  { id: 'idea-4', title: 'Shielding Tool-Using Agents', shelf: 'formal', status: 'planned', year: '', abstract: 'Synthesise shields from temporal specs that block unsafe tool calls before they execute, and measure task-success cost.', tags: ['shields', 'tool use'], color: '#20343c' },
  { id: 'idea-5', title: 'Monitorability of LLM Specs', shelf: 'formal', status: 'planned', year: '', abstract: 'Which natural-language safety policies can be turned into monitorable temporal properties at all? A taxonomy and an LLM-assisted translator.', tags: ['LTL', 'NL-to-spec'], color: '#20343c' },
  { id: 'idea-6', title: 'Monitors for Trading Agents', shelf: 'formal', status: 'planned', year: '', abstract: 'Bridge the quant fund and RV work: compliance rules (position limits, wash trades) as runtime monitors over agent order flow.', tags: ['compliance', 'finance'], color: '#20343c' },
  { id: 'idea-7', title: 'LLM Sentiment vs. Price Drift', shelf: 'markets', status: 'planned', year: '', abstract: 'Does LLM-scored news sentiment predict post-announcement drift once you control for look-ahead leakage in the model itself?', tags: ['NLP', 'alpha'], color: '#233d2c' },
  { id: 'idea-8', title: 'Adversarial News for Trading Bots', shelf: 'markets', status: 'planned', year: '', abstract: 'RAG poisoning meets markets: can a fake press release steer an agentic trader? Threat model and defences.', tags: ['security', 'markets'], color: '#233d2c' },
  { id: 'idea-9', title: 'Emergent Collusion in Agent Markets', shelf: 'agents', status: 'planned', year: '', abstract: 'Do independently trained LLM market-makers learn to keep spreads wide without talking to each other?', tags: ['game theory', 'LLM'], color: '#33284a' },
  { id: 'idea-10', title: 'Byzantine Agents in a Swarm', shelf: 'agents', status: 'planned', year: '', abstract: 'How many compromised agents does it take to derail a swarm consensus, and can monitors catch them?', tags: ['robustness', 'swarm'], color: '#33284a' },
  { id: 'idea-11', title: 'Shot Quality from Tracking Data', shelf: 'sport', status: 'planned', year: '', abstract: 'An expected-points model for basketball shots using defender distance, shot clock and player history.', tags: ['basketball', 'xP'], color: '#4a3220' },
  { id: 'idea-12', title: 'Lineup Synergy with Graph Nets', shelf: 'sport', status: 'planned', year: '', abstract: 'Model five-player lineups as graphs and learn which combinations outperform the sum of their parts.', tags: ['basketball', 'GNN'], color: '#4a3220' },
]

// ── Systems ──────────────────────────────────────────────────────────────────
export const quantFund = {
  title: '✎ Agentic Quant Fund',
  summary:
    '✎ A team of cooperating agents (research, signal, risk and execution) that runs a fund end to end. Describe the universe, frequency and what makes it different.',
  agents: [
    { name: 'Research', does: '✎ Reads filings and news, writes theses' },
    { name: 'Signal', does: '✎ Turns theses and factors into scores' },
    { name: 'Portfolio', does: '✎ Sizes positions under constraints' },
    { name: 'Risk', does: '✎ Vetoes trades that break limits' },
    { name: 'Execution', does: '✎ Routes orders, tracks slippage' },
  ],
  /** Set to your real backtest numbers; until then the chart shows SAMPLE DATA. */
  metrics: null as null | { label: string; value: string }[],
  stack: ['Python', 'LLM agents', 'pandas', 'vectorbt', '✎'],
  links: [
    { label: 'Repository', href: '✎ https://github.com/...' },
    { label: 'Live dashboard', href: '✎ https://...' },
  ] as Link[],
  learned: ['✎ What building it taught you, one point per line.'],
}

export const ragLab = {
  title: 'AegisRAG: Poisoning a Security RAG',
  summary:
    'An attacker who can edit an existing knowledge base swaps words for synonyms until a classifier’s label flips. The text still reads almost normally (“implants malicious software” became “Engraft Malicious Package”), but answers to a cybersecurity question-answering system get measurably worse. I built the system, the attack, a benchmark and the defences.',
  setup: [
    { k: 'Corpus', v: '18 docs · 200 passages · 14 attack types, from MITRE ATT&CK + CAPEC' },
    { k: 'Stack', v: 'FastAPI · LangChain · Qdrant · all-MiniLM-L6-v2 · gpt-4o-mini · Next.js' },
    { k: 'Benchmark', v: '44 reviewed questions × 3 runs per condition, checksummed records' },
    { k: 'Judge', v: 'LLM judge vs. my blind grades on 75 answers: weighted κ = 0.82' },
  ],
  results: [
    { label: 'Clean', correctness: 0.714, refusals: 26 },
    { label: 'Poisoned (PWWS)', correctness: 0.555, refusals: 45 },
    { label: '+ Monitor', correctness: 0.515, refusals: null as number | null },
    { label: '+ Monitor + MITRE fallback', correctness: 0.786, refusals: 7 },
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
    'One term of the KL divergence (how much likelier a word’s best synonym is) beats the whole sum.',
    'A likelihood-constrained adaptive attacker succeeded on 0 of 57 sections.',
    'Filtering makes the knowledge base safer, not more useful. Getting answers back needs a trusted source.',
  ],
  links: [
    { label: 'Code on GitHub', href: 'https://github.com/Aliyousefi9403/dissertation-RAG' },
    { label: 'The full story (blog)', href: 'https://aliyousefi9403.github.io/posts/three-months-in-from-a-rag-demo-to-a-paper/' },
    { label: 'Paper (PDF)', href: '✎ papers/aegisrag.pdf' },
  ] as Link[],
}

export const rv = {
  title: 'A Runtime Monitor That Remembers',
  summary:
    'Filters forget, and they throw away the evidence with the poison. Following Dr Hafizul Asad’s suggestion, I added runtime verification: every answer is checked against rules before the user sees it, violations are fed back, and the passages that caused them are remembered.',
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
    'The first φ1 flagged words the model chose itself and wrongly withheld 10 answers. Fixed to count only copied words, then the full experiment was re-run; both runs are kept.',
    'Blame is rough: on PWWS only 10 of the 18 quarantined passages were actually edited.',
    'The fallback beats the clean system only because it adds trusted text. It shows what a trusted source can add, not what detection can.',
  ],
  links: [
    { label: 'Code on GitHub', href: 'https://github.com/Aliyousefi9403/dissertation-RAG' },
    { label: 'Research blog', href: 'https://aliyousefi9403.github.io' },
  ] as Link[],
  learned: ['A memory is only as good as the step that decides what to remember.'],
}

export const internship = {
  company: 'Adaptive Swarm',
  role: '✎ Machine Learning Intern',
  when: '✎ Month 20XX to Month 20XX',
  summary: '✎ What the company does and what you were brought in to work on.',
  timeline: [
    { when: '✎ Week 1–4', what: '✎ First thing you learned or shipped' },
    { when: '✎ Month 2', what: '✎ The project that clicked' },
    { when: '✎ Month 3', what: '✎ What you delivered' },
  ],
  learned: ['✎ Machine learning fundamentals you picked up', '✎ Engineering habits', '✎ How it led to the quant fund / RAG work'],
  links: [] as Link[],
}

export const basketball = {
  headline: 'Basketball',
  story: [
    '✎ How you started playing and what the game means to you.',
    '✎ The national team: which team, which years, which tournaments.',
    '✎ What basketball taught you that shows up in your research.',
  ],
  facts: [
    { k: 'Position', v: '✎' },
    { k: 'National team', v: '✎' },
    { k: 'Years playing', v: '✎' },
    { k: 'Jersey', v: '✎ #' },
  ],
  highlights: ['✎ Tournament / medal / moment', '✎ Tournament / medal / moment'],
  /** put photos in /public/photos and list them here */
  photos: [] as string[],
  links: [] as Link[],
}
