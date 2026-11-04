import { useMemo, useState } from 'react'

type Swap = [poisoned: string, original: string]
type Round = {
  label: string
  prompt: string
  kind: 'answer' | 'passage'
  clean: string
  poisoned: string
  swaps: Swap[]
  verdict: { caught: boolean; who: string; text: string }
}

/**
 * Three rounds built from examples in the paper. Wording of the passages is
 * illustrative; the swaps, outcomes and numbers are the ones reported.
 */
const ROUNDS: Round[] = [
  {
    label: 'Round 1 · the answer',
    prompt: 'A user asks: “What does an attacker do after compromising an IoT device to keep access?” One answer came from the clean knowledge base, one from the poisoned one.',
    kind: 'answer',
    clean: 'The attacker implants malicious software, a backdoor, that opens a hidden channel for persistent remote access to the device.',
    poisoned: 'The attacker moves to the Engraft Malicious Package stage, which opens a hidden channel for persistent remote access to the device.',
    swaps: [
      ['Engraft', 'implants'],
      ['Package', 'software'],
    ],
    verdict: {
      caught: true,
      who: 'Runtime monitor, rule φ1',
      text: '“Engraft” is a rare word copied from a retrieved passage that MITRE never uses, so φ1 fires. The passage is quarantined and φ3 keeps it out of every later answer. In the study the model only repeated poisoned text as fact twice in 132 answers; this was that case.',
    },
  },
  {
    label: 'Round 2 · the passage',
    prompt: 'Two versions of the same knowledge-base passage. PWWS swapped one word in one of them. Which one?',
    kind: 'passage',
    clean: 'With a spoofed source address, the attacker can deny sending the traffic, and the victim cannot trace the flood back to its origin.',
    poisoned: 'With a spoofed source address, the attacker can abnegate sending the traffic, and the victim cannot trace the flood back to its origin.',
    swaps: [['abnegate', 'deny']],
    verdict: {
      caught: true,
      who: 'Synonym-gap detector',
      text: 'A small language model finds “deny” far more probable than “abnegate” in this sentence: the gap is many bits, so the passage is flagged and the detector even names the likely original. This detector reached AUROC 0.95 on PWWS while staying near chance on the layout-only control.',
    },
  },
  {
    label: 'Round 3 · the hard one',
    prompt: 'This attacker knows about the detector and only swaps in words that are at least as common as the originals. Which passage was edited?',
    kind: 'passage',
    clean: 'The attacker sends many SYN requests and never completes the handshake, so the server keeps half-open connections until its backlog is full.',
    poisoned: 'The attacker sends many SYN requests and never finishes the handshake, so the server keeps half-open links until its backlog is full.',
    swaps: [
      ['finishes', 'completes'],
      ['links', 'connections'],
    ],
    verdict: {
      caught: true,
      who: 'Mostly caught',
      text: 'The frequency-matched attacker beats the word-frequency detector, because no swapped word is rare. The language-model detector still flagged 10 of its 13 edits, and the constraint crippled the attack: it succeeded on 8 sections instead of 39. An attacker that also had to keep the passage as probable succeeded on 0 of 57.',
    },
  },
]

function Marked({ text, swaps, show }: { text: string; swaps: Swap[]; show: boolean }) {
  if (!show) return <>{text}</>
  const words = swaps.map((s) => s[0])
  const parts = text.split(new RegExp(`\\b(${words.join('|')})\\b`, 'g'))
  return (
    <>
      {parts.map((p, i) => {
        const s = swaps.find((x) => x[0] === p)
        return s ? (
          <mark key={i}>
            {p}
            <small>← {s[1]}</small>
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      })}
    </>
  )
}

export function SpotThePoison() {
  const [r, setR] = useState(0)
  const [pick, setPick] = useState<null | 'A' | 'B'>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const round = ROUNDS[r]
  // shuffle which side is poisoned, stable per round
  const poisonSide = useMemo(() => (Math.random() < 0.5 ? 'A' : 'B'), [r])
  const sides = poisonSide === 'A' ? { A: round.poisoned, B: round.clean } : { A: round.clean, B: round.poisoned }
  const right = pick === poisonSide

  const choose = (s: 'A' | 'B') => {
    if (pick) return
    setPick(s)
    if (s === poisonSide) setScore((x) => x + 1)
  }
  const next = () => {
    if (r === ROUNDS.length - 1) return setDone(true)
    setR((x) => x + 1)
    setPick(null)
  }
  const restart = () => {
    setR(0)
    setPick(null)
    setScore(0)
    setDone(false)
  }

  if (done)
    return (
      <div className="stp">
        <div className="stp-end">
          <div className="sec-kicker">Your score</div>
          <b>
            {score} / {ROUNDS.length}
          </b>
          <p>{score === ROUNDS.length ? 'Sharper than most readers. The edits are designed to read as normal text.' : 'Two changed words are easy to miss. That’s exactly why the defence has to be automatic.'}</p>
          <div className="links">
            <button className="btn btn-primary" onClick={restart}>
              Play again
            </button>
            <a className="btn" href="#read" onClick={(e) => (e.preventDefault(), import('../../store').then(({ useRoom }) => useRoom.getState().setReader('aegisrag')))}>
              Read the paper
            </a>
          </div>
        </div>
      </div>
    )

  return (
    <div className="stp">
      <div className="stp-head">
        <span>{round.label}</span>
        <span>
          Score {score} / {r + (pick ? 1 : 0)}
        </span>
      </div>
      <p className="stp-prompt">{round.prompt}</p>
      <div className="stp-opts">
        {(['A', 'B'] as const).map((s) => {
          const isPoison = s === poisonSide
          const cls = !pick ? '' : isPoison ? 'is-poison' : 'is-clean'
          return (
            <button key={s} className={`stp-opt ${cls} ${pick === s ? 'picked' : ''}`} onClick={() => choose(s)} disabled={!!pick}>
              <em>{s}</em>
              <span>
                <Marked text={sides[s]} swaps={round.swaps} show={!!pick && isPoison} />
              </span>
              {pick && <i>{isPoison ? 'Poisoned' : 'Clean'}</i>}
            </button>
          )
        })}
      </div>
      {!pick && <div className="stp-hint">Tap the one you think was poisoned.</div>}
      {pick && (
        <div className={`stp-reveal ${right ? 'ok' : 'miss'}`}>
          <b>{right ? 'You spotted it.' : 'It fooled you.'}</b>
          <div className="stp-who">{round.verdict.who}</div>
          <p>{round.verdict.text}</p>
          <button className="btn btn-primary" onClick={next}>
            {r === ROUNDS.length - 1 ? 'See your score' : 'Next round →'}
          </button>
        </div>
      )}
      <p className="fine">Passages are paraphrased for the game; the swapped words, outcomes and numbers come from the study.</p>
    </div>
  )
}
