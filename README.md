# The Room

An interactive 3D room holding my research, systems and story. Every object is a project: open the books, poison a RAG system, watch a runtime monitor catch it, shoot a few hoops.

**Live:** https://aliyousefi9403.github.io/3D-Room/

## Stations

| Station | What's there |
|---|---|
| **Library** | One shelf per research area. Real papers, lab notebooks (blog posts), the papers I built on, and ghosted "in the works" spines for ideas. Click a book to read it. |
| **Trading Desk** | The agentic quant fund: live-drawn trading screens and the agent architecture. |
| **Security Lab** | AegisRAG. An interactive lab: switch between a clean and a PWWS-poisoned knowledge base, add defences, watch retrieval and the answer change. Real results and detector AUROCs. |
| **Monitor Wall** | The runtime-verification monitor (φ1–φ3) running as a status wall, with a step-through of the loop. |
| **Agent Crew** | Three hover-bots act out AegisRAG on loop: Mallory poisons the knowledge base, Scout retrieves it, Warden's monitor catches it. Click any of them. |
| **Swarm Table** | Adaptive Swarm internship, with a live boids simulation in a glass dome. |
| **Court Corner** | Basketball and the national team. The hoop works. |
| **Writing Desk** | About me and the CV. |

## Editing content

**Everything lives in [`src/content.ts`](src/content.ts).** Any text that starts with `✎` is a placeholder, and the site shows it with a dashed gold outline until you replace it.

- **Papers:** add an entry to `papers`. Put the PDF in `public/papers/` and set `pdf: 'papers/your-file.pdf'`. It gets an in-page reader and a download button.
- **CV:** drop it at `public/cv/Ali_Yousefi_CV.pdf` and change `cvUrl` to `'cv/Ali_Yousefi_CV.pdf'` (remove the `✎`).
- **Photos:** put them in `public/photos/` and list them in `basketball.photos`.
- **Ideas → papers:** change a book's `status` from `'planned'` to `'in-progress'`, `'preprint'` or `'published'`. Its spine stops being a ghost.
- **Agent Crew script:** [`src/crew.ts`](src/crew.ts) holds the paths, lines and timing.

## Run locally

```bash
npm install
npm run dev
```

Add `?lite` to the URL to force the low-power renderer. It also switches on automatically on slow devices.

## Deploy

Pushing to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`. One-time setup: in the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.

## Stack

React Three Fiber · drei · postprocessing (N8AO, bloom, outline, AgX) · Vite · TypeScript · Zustand. All geometry and textures are procedural (canvas-drawn), so there are no model downloads.

---

## Ideas: research and projects to fill the shelves

Each of these has a ghost book on the shelf already.

**AI security** (extends AegisRAG)
1. **Cross-lingual RAG poisoning.** Do poisoned passages in one language hijack answers in another? Multilingual embedders make this likely and under-studied.
2. **Poisoning agent memory.** Long-term agent memory is a corpus the attacker can write to. Measure how long one poisoned memory persists and how far it spreads.
3. **Certified retrieval bounds.** How many edited passages can top-k retrieval tolerate before the answer flips? Isolate-then-aggregate gives provable bounds.

**Formal methods** (extends the monitor)
4. **Shielding tool-using agents.** Turn temporal specs into shields that block unsafe tool calls before they run.
5. **Monitorability of natural-language policies.** Which safety policies can become monitorable LTL at all? A taxonomy plus an LLM-assisted translator.
6. **Monitors for trading agents.** Bridges the quant fund and the RV work: position limits and wash-trade rules as runtime monitors over agent order flow.

**Markets & ML**
7. **LLM sentiment vs. post-announcement drift,** controlling for look-ahead leakage inside the model itself.
8. **Adversarial news for trading bots.** RAG poisoning meets markets: can a fake press release steer an agentic trader?

**Multi-agent systems**
9. **Emergent collusion** among independently trained LLM market-makers.
10. **Byzantine agents in a swarm.** How many compromised agents derail consensus, and can monitors catch them? (The red boids on the Swarm Table are a teaser.)

**Sport analytics**
11. **Expected points for basketball shots** from defender distance, shot clock and player history.
12. **Lineup synergy with graph neural nets.** Which five-player combinations beat the sum of their parts?

**Systems to build into the room next**
- **Make the Agent Crew real:** replace the script with actual LLM agents running the AegisRAG pipeline against a small in-browser corpus (transformers.js embeddings plus a hosted model), so visitors type a question and watch the crew handle it live.
- **A terminal on the laptop:** a small shell where `ls papers`, `cat cv` and `run attack` work.
- **Day/night switch** with a warm morning lighting rig.
