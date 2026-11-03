# The Room

An interactive 3D room holding my research, systems and story. Every object is a project: open the books, poison a RAG system, watch a runtime monitor catch it, shoot a few hoops.

**Live:** https://aliyousefi9403.github.io/3D-Room/

## Stations

| Station | What's there |
|---|---|
| **Library** | Five shelves: Research, Red Team, Things I Built, Markets & ML, Ideas & Curiosities. Scroll over the shelf and each item slides out and turns to face you; some are books, some are objects (the Hack The Box cube, the quantum atom, the Batis coin, the UKMT medal). |
| **Paper reader** | *Reading the Poison* (Yousefi, Asad & Komninos), page by page with a flip animation, plus PDF download. |
| **Security Lab** | AegisRAG: an interactive poisoning lab with real results and detector AUROCs. |
| **Monitor Wall** | AegisRAG part II: the runtime-verification monitor (φ1–φ3) as a live status wall. |
| **Night Watch** | A real mini-SOC. Five devices in the room form a network with live traffic; five detection rules (MITRE-mapped) run over sliding windows; three agents (Sentry, Analyst, Medic) walk to the device, triage and contain. Visitors can launch attacks. When it's quiet, two agents play 1v1 basketball. |
| **Trading Desk** | quantdesk, with live BTC/ETH from Coinbase (Kraken fallback) and EMA, RSI, MACD and Bollinger computed in the browser. |
| **Swarm Table** | Adaptive Swarm: a hologram of the indicator pipeline fed by the live BTC stream. |
| **Studio** | A 2D cybersecurity explainer (phishing) animated live on Canvas. |
| **Quantum Corner** | A Bloch-sphere qubit you can rotate, gate (H, X, Z, S) and measure with Born-rule statistics; a Newton's cradle and a spinning top. |
| **Court** | Jersey #13 (Iran U18), U21 champion medal, ACL x-ray light box. Drag-to-shoot with real ball physics. |
| **The View** | London from the window, in four parallax layers. |
| **Desk** | About, experience, and the actual CV on the desk (download). |

## Editing content

**Everything lives in [`src/content.ts`](src/content.ts).** Any text that starts with `✎` is a placeholder, and the site shows it with a dashed gold outline until you replace it.

- **Papers:** add an entry to `papers`. Put the PDF in `public/papers/` and set `pdf: 'papers/your-file.pdf'`. It gets an in-page reader and a download button.
- **CV:** replace `public/cv/Ali_Yousefi_CV.pdf` and re-render the desk image: `pdftoppm -png -r 110 -f 1 -l 1 public/cv/Ali_Yousefi_CV.pdf public/cv/cv-page`.
- **Paper pages:** after updating the PDF, `pdftoppm -jpeg -jpegopt quality=74 -r 130 public/papers/aegisrag.pdf public/papers/aegisrag-p`.
- **Photos:** put them in `public/photos/` and list them in `basketball.photos`.
- **Ideas → papers:** change an item's `kind` from `'idea'` to `'paper'`.
- **Night Watch:** devices and rules in [`src/sim/network.ts`](src/sim/network.ts), agent behaviour in [`src/sim/crew.ts`](src/sim/crew.ts), navigation in [`src/sim/nav.ts`](src/sim/nav.ts).

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
