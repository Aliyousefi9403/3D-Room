/** One qubit on the Bloch sphere: |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ */
export const qubit = {
  theta: Math.PI / 3,
  phi: 0.6,
  evolve: true,
  collapsed: null as null | { to: 0 | 1; at: number },
  counts: [0, 0] as [number, number],
}
const fns = new Set<() => void>()
export const onQubit = (f: () => void) => (fns.add(f), () => fns.delete(f))
export const emitQubit = () => fns.forEach((f) => f())

export const p0 = () => Math.cos(qubit.theta / 2) ** 2

export function measure(n = 1) {
  let last: 0 | 1 = 0
  for (let i = 0; i < n; i++) {
    last = Math.random() < p0() ? 0 : 1
    qubit.counts[last]++
  }
  qubit.collapsed = { to: last, at: performance.now() / 1000 }
  emitQubit()
  return last
}

/** Single-qubit gates as rotations of the Bloch vector. */
export function gate(g: 'H' | 'X' | 'Z' | 'S') {
  const { theta: t, phi: f } = qubit
  let x = Math.sin(t) * Math.cos(f)
  let y = Math.sin(t) * Math.sin(f)
  let z = Math.cos(t)
  if (g === 'X') [y, z] = [-y, -z]
  if (g === 'Z') [x, y] = [-x, -y]
  if (g === 'S') [x, y] = [-y, x]
  if (g === 'H') [x, y, z] = [z, -y, x]
  qubit.theta = Math.acos(Math.max(-1, Math.min(1, z)))
  qubit.phi = Math.atan2(y, x)
  qubit.collapsed = null
  emitQubit()
}

export function prepare(theta: number, phi: number) {
  qubit.theta = theta
  qubit.phi = phi
  qubit.collapsed = null
  emitQubit()
}
