import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

/** Spotlight whose target lives in the scene graph (local coordinates of the parent). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Spot({ position, target, ...props }: { position: [number, number, number]; target: [number, number, number]; [k: string]: any }) {
  const light = useRef<THREE.SpotLight>(null)
  const tgt = useRef<THREE.Object3D>(null)
  useLayoutEffect(() => {
    if (light.current && tgt.current) light.current.target = tgt.current
  }, [])
  return (
    <>
      <spotLight ref={light} position={position} {...props} />
      <object3D ref={tgt} position={target} />
    </>
  )
}
