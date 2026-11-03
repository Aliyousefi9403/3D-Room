/**
 * Live market data for the room's screens.
 * Coinbase Exchange public REST for history + websocket for ticks; Kraken REST
 * as a fallback; a clearly-labelled simulation if the visitor is offline.
 */
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number }
export type Tick = { t: number; price: number; size: number; side: 'buy' | 'sell' }
export type Feed = {
  product: string
  candles: Candle[]
  trades: Tick[]
  status: 'connecting' | 'live' | 'delayed' | 'simulated'
  source: string
  last: number
  change24?: number
  ind: Indicators
}
export type Indicators = { ema20: number[]; ema50: number[]; rsi: number[]; macd: number[]; signal: number[]; bbU: number[]; bbL: number[]; bbM: number[] }

const N = 120
const products = ['BTC-USD', 'ETH-USD'] as const
export type Product = (typeof products)[number]

const empty = (): Indicators => ({ ema20: [], ema50: [], rsi: [], macd: [], signal: [], bbU: [], bbL: [], bbM: [] })
export const feeds: Record<Product, Feed> = {
  'BTC-USD': { product: 'BTC-USD', candles: [], trades: [], status: 'connecting', source: '', last: 0, ind: empty() },
  'ETH-USD': { product: 'ETH-USD', candles: [], trades: [], status: 'connecting', source: '', last: 0, ind: empty() },
}

// ── indicators ───────────────────────────────────────────────────────────────
function ema(xs: number[], n: number) {
  const k = 2 / (n + 1)
  const out: number[] = []
  xs.forEach((x, i) => out.push(i ? x * k + out[i - 1] * (1 - k) : x))
  return out
}
function rsi(xs: number[], n = 14) {
  const out: number[] = []
  let g = 0
  let l = 0
  for (let i = 0; i < xs.length; i++) {
    if (i === 0) {
      out.push(50)
      continue
    }
    const d = xs[i] - xs[i - 1]
    const up = Math.max(d, 0)
    const dn = Math.max(-d, 0)
    if (i <= n) {
      g += up / n
      l += dn / n
    } else {
      g = (g * (n - 1) + up) / n
      l = (l * (n - 1) + dn) / n
    }
    out.push(l === 0 ? 100 : 100 - 100 / (1 + g / l))
  }
  return out
}
export function compute(f: Feed) {
  const c = f.candles.map((x) => x.c)
  const e12 = ema(c, 12)
  const e26 = ema(c, 26)
  const macd = c.map((_, i) => e12[i] - e26[i])
  const bbM: number[] = []
  const bbU: number[] = []
  const bbL: number[] = []
  c.forEach((_, i) => {
    const w = c.slice(Math.max(0, i - 19), i + 1)
    const m = w.reduce((a, b) => a + b, 0) / w.length
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / w.length)
    bbM.push(m)
    bbU.push(m + 2 * sd)
    bbL.push(m - 2 * sd)
  })
  f.ind = { ema20: ema(c, 20), ema50: ema(c, 50), rsi: rsi(c), macd, signal: ema(macd, 9), bbU, bbL, bbM }
}

/** A transparent, rule-based read of the indicators (not a trading model). */
export function read(f: Feed) {
  const i = f.ind
  const k = f.candles.length - 1
  if (k < 30) return null
  const trend = i.ema20[k] > i.ema50[k] ? 1 : -1
  const mom = i.macd[k] > i.signal[k] ? 1 : -1
  const r = i.rsi[k]
  const bbPos = (f.candles[k].c - i.bbL[k]) / Math.max(1e-9, i.bbU[k] - i.bbL[k])
  const score = 0.45 * trend + 0.35 * mom + 0.2 * (r > 70 ? -1 : r < 30 ? 1 : (r - 50) / 20)
  return { trend, mom, rsi: r, bbPos, score: Math.max(-1, Math.min(1, score)) }
}

// ── plumbing ─────────────────────────────────────────────────────────────────
const listeners = new Set<() => void>()
export const onMarket = (fn: () => void) => (listeners.add(fn), () => listeners.delete(fn))
const emit = () => listeners.forEach((fn) => fn())
let started = false

async function history(p: Product): Promise<boolean> {
  try {
    const r = await fetch(`https://api.exchange.coinbase.com/products/${p}/candles?granularity=60`, { signal: AbortSignal.timeout(7000) })
    if (!r.ok) throw new Error(String(r.status))
    const rows: number[][] = await r.json()
    feeds[p].candles = rows
      .slice(0, N)
      .reverse()
      .map(([t, l, h, o, c, v]) => ({ t: t * 1000, o, h, l, c, v }))
    feeds[p].source = 'Coinbase'
    return true
  } catch {
    try {
      const pair = p === 'BTC-USD' ? 'XBTUSD' : 'ETHUSD'
      const r = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1`, { signal: AbortSignal.timeout(7000) })
      const j = await r.json()
      const rows: (string | number)[][] = Object.values(j.result).find(Array.isArray) as (string | number)[][]
      feeds[p].candles = rows.slice(-N).map((x) => ({ t: +x[0] * 1000, o: +x[1], h: +x[2], l: +x[3], c: +x[4], v: +x[6] }))
      feeds[p].source = 'Kraken'
      feeds[p].status = 'delayed'
      return true
    } catch {
      return false
    }
  }
}

function applyTick(p: Product, price: number, size: number, side: 'buy' | 'sell', t = Date.now()) {
  const f = feeds[p]
  f.last = price
  f.trades.push({ t, price, size, side })
  if (f.trades.length > 40) f.trades.shift()
  const minute = Math.floor(t / 60000) * 60000
  const last = f.candles[f.candles.length - 1]
  if (!last || minute > last.t) {
    f.candles.push({ t: minute, o: price, h: price, l: price, c: price, v: size })
    if (f.candles.length > N) f.candles.shift()
  } else {
    last.c = price
    last.h = Math.max(last.h, price)
    last.l = Math.min(last.l, price)
    last.v += size
  }
}

function simulate(p: Product) {
  const f = feeds[p]
  f.status = 'simulated'
  f.source = 'offline simulation'
  let price = p === 'BTC-USD' ? 77000 : 3000
  if (!f.candles.length) {
    const now = Date.now()
    for (let i = N; i > 0; i--) {
      const o = price
      price *= 1 + (Math.random() - 0.5) * 0.002
      f.candles.push({ t: now - i * 60000, o, h: Math.max(o, price) * 1.0004, l: Math.min(o, price) * 0.9996, c: price, v: Math.random() * 5 })
    }
  } else price = f.candles[f.candles.length - 1].c
  setInterval(() => {
    price *= 1 + (Math.random() - 0.5) * 0.0006
    applyTick(p, price, Math.random() * 0.2, Math.random() > 0.5 ? 'buy' : 'sell')
    compute(f)
    emit()
  }, 700)
}

function socket() {
  let ws: WebSocket
  let alive = false
  let dirty = false
  try {
    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com')
  } catch {
    products.forEach(simulate)
    return
  }
  ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', product_ids: products, channels: ['ticker'] }))
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.type !== 'ticker' || !(m.product_id in feeds)) return
    const p = m.product_id as Product
    alive = true
    feeds[p].status = 'live'
    feeds[p].source = 'Coinbase'
    const open24 = +m.open_24h
    if (open24) feeds[p].change24 = (+m.price - open24) / open24
    applyTick(p, +m.price, +m.last_size || 0, m.side === 'sell' ? 'buy' : 'sell', Date.parse(m.time) || Date.now())
    dirty = true
  }
  ws.onclose = () => setTimeout(socket, 4000)
  setTimeout(() => {
    if (!alive) products.forEach((p) => feeds[p].status !== 'live' && feeds[p].candles.length === 0 && simulate(p))
  }, 9000)
  // recompute indicators at most a few times a second
  setInterval(() => {
    if (!dirty) return
    dirty = false
    products.forEach((p) => compute(feeds[p]))
    emit()
  }, 400)
}

export function startMarket() {
  if (started) return
  started = true
  Promise.all(products.map(history)).then((ok) => {
    products.forEach((p, i) => {
      if (ok[i]) {
        compute(feeds[p])
        feeds[p].last = feeds[p].candles[feeds[p].candles.length - 1]?.c ?? 0
      } else simulate(p)
    })
    emit()
    socket()
  })
}
