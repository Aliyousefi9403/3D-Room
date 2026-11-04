import { useRoom } from '../store'

/** Decorative point light: skipped on the low-power tier, where every light costs every pixel. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PL(props: any) {
  const lite = useRoom((s) => s.lite)
  return lite ? null : <pointLight {...props} />
}

/** Canvas-texture redraw interval, doubled on the low tier. */
export const every = (seconds: number) => (useRoom.getState().lite ? seconds * 2 : seconds)
