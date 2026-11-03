import { create } from 'zustand'

export type StationId = 'overview' | 'library' | 'quant' | 'rag' | 'rv' | 'swarm' | 'basketball' | 'about' | 'crew'

type State = {
  station: StationId
  /** panel visible (after camera arrives) */
  panel: boolean
  paperId: string | null
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
  shot: (made: boolean) => void
}

export const useRoom = create<State>((set) => ({
  station: 'overview',
  panel: false,
  paperId: null,
  hovered: null,
  score: 0,
  shots: 0,
  lite: typeof location !== 'undefined' && new URLSearchParams(location.search).has('lite'),
  visited: [],
  tour: false,
  list: false,
  setLite: (lite) => set({ lite }),
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
  shot: (made) => set((s) => ({ shots: s.shots + 1, score: s.score + (made ? 1 : 0) })),
}))

export const stations: { id: Exclude<StationId, 'overview'>; label: string; kicker: string }[] = [
  { id: 'library', label: 'Library', kicker: 'Papers & research' },
  { id: 'quant', label: 'Trading Desk', kicker: 'Agentic quant fund' },
  { id: 'rag', label: 'Security Lab', kicker: 'RAG poisoning' },
  { id: 'rv', label: 'Monitor Wall', kicker: 'Runtime verification' },
  { id: 'swarm', label: 'Swarm Table', kicker: 'Adaptive Swarm internship' },
  { id: 'basketball', label: 'Court Corner', kicker: 'Basketball' },
  { id: 'crew', label: 'Agent Crew', kicker: 'Live multi-agent demo' },
  { id: 'about', label: 'Writing Desk', kicker: 'About & CV' },
]
