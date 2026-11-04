import { create } from 'zustand'

export type StationId = 'overview' | 'library' | 'quant' | 'rag' | 'rv' | 'swarm' | 'basketball' | 'about' | 'crew' | 'window' | 'quantum' | 'studio'

type State = {
  station: StationId
  /** panel visible (after camera arrives) */
  panel: boolean
  paperId: string | null
  libIndex: number
  reader: string | null
  setLibIndex: (i: number) => void
  setReader: (id: string | null) => void
  hovered: string | null
  score: number
  shots: number
  lite: boolean
  visited: string[]
  tour: boolean
  list: boolean
  setLite: (v: boolean) => void
  setTour: (v: boolean) => void
  setList: (v: boolean) => void
  go: (s: StationId) => void
  openPanel: () => void
  setPaper: (id: string | null) => void
  setHovered: (h: string | null) => void
  shot: (made: boolean, attempt?: boolean) => void
  dragging: boolean
  video: string
  music: boolean
  setMusic: (v: boolean) => void
  setVideo: (id: string) => void
  surge: number
  fire: () => void
  setDragging: (v: boolean) => void
}

/** Start on the low-power tier for phones, tablets and modest laptops; ?lite / ?hq force it. */
function detectLite() {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(location.search)
  if (q.has('lite')) return true
  if (q.has('hq')) return false
  try {
    const saved = localStorage.getItem('room-quality')
    if (saved) return saved === 'low'
  } catch {
    /* storage unavailable */
  }
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent) || (nav.maxTouchPoints > 1 && window.innerWidth < 1100)
  return mobile || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4
}

export const useRoom = create<State>((set) => ({
  station: 'overview',
  panel: false,
  paperId: null,
  libIndex: 0,
  reader: null,
  setLibIndex: (libIndex) => set({ libIndex }),
  setReader: (reader) => set({ reader }),
  hovered: null,
  score: 0,
  shots: 0,
  lite: detectLite(),
  visited: [],
  tour: false,
  list: false,
  setLite: (lite) => {
    try {
      localStorage.setItem('room-quality', lite ? 'low' : 'high')
    } catch {
      /* storage unavailable */
    }
    set({ lite })
  },
  setTour: (tour) => set({ tour }),
  setList: (list) => set({ list }),
  go: (station) =>
    set((s) => ({
      station,
      panel: false,
      paperId: null,
      visited: station === 'overview' || s.visited.includes(station) ? s.visited : [...s.visited, station],
    })),
  openPanel: () => set({ panel: true }),
  setPaper: (paperId) => set({ paperId }),
  setHovered: (hovered) => set({ hovered }),
  shot: (made, attempt) => set((s) => ({ shots: s.shots + (attempt ? 1 : 0), score: s.score + (made ? 1 : 0) })),
  dragging: false,
  video: 'i7XOZuSWM0Q',
  music: (() => {
    try {
      return localStorage.getItem('room-music') !== 'off'
    } catch {
      return true
    }
  })(),
  setMusic: (music) => {
    try {
      localStorage.setItem('room-music', music ? 'on' : 'off')
    } catch {
      /* storage unavailable */
    }
    set({ music })
  },
  setVideo: (video) => set({ video }),
  surge: -100,
  fire: () => set({ surge: performance.now() / 1000 }),
  setDragging: (dragging) => set({ dragging }),
}))

export const stations: { id: Exclude<StationId, 'overview'>; label: string; kicker: string }[] = [
  { id: 'library', label: 'Library', kicker: 'Research, red team & builds' },
  { id: 'rag', label: 'Security Lab', kicker: 'AegisRAG · poisoning' },
  { id: 'rv', label: 'Monitor Wall', kicker: 'AegisRAG II · runtime verification' },
  { id: 'crew', label: 'Night Watch', kicker: 'Live multi-agent SOC' },
  { id: 'quant', label: 'Trading Desk', kicker: 'quantdesk · live markets' },
  { id: 'swarm', label: 'Swarm Table', kicker: 'Adaptive Swarm · Bitcoin model' },
  { id: 'studio', label: 'Studio', kicker: 'BreachLab on YouTube' },
  { id: 'quantum', label: 'Quantum Corner', kicker: 'Measure a qubit' },
  { id: 'basketball', label: 'Court', kicker: 'Iran U18 · #13' },
  { id: 'window', label: 'The View', kicker: 'London from my window' },
  { id: 'about', label: 'Desk', kicker: 'About & CV' },
]
