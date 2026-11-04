import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useRoom } from '../store'

/** Spotlight whose target lives in the scene graph (local coordinates of the parent). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Spot({ position, target, keep, ...props }: { position: [number, number, number]; target: [number, number, number]; keep?: boolean; [k: string]: any }) {
  const lite = useRoom((s) => s.lite)
  const light = useRef<THREE.SpotLight>(null)
  const tgt = useRef<THREE.Object3D>(null)
  useLayoutEffect(() => {
    if (light.current && tgt.current) light.current.target = tgt.current
  })
  if (lite && !keep) return null
  return (
    <>
      <spotLight ref={light} position={position} {...props} />
      <object3D ref={tgt} position={target} />
    </>
  )
}
