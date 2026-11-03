import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, AdaptiveDpr, Preload, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, N8AO, Selection, Outline, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { Room } from './Room'
import { CameraRig } from './CameraRig'
import { Library } from './stations/Library'
import { TradingDesk } from './stations/TradingDesk'
import { SecurityLab } from './stations/SecurityLab'
import { MonitorWall } from './stations/MonitorWall'
import { SwarmTable } from './stations/SwarmTable'
import { Basketball } from './stations/Basketball'
import { AboutDesk } from './stations/AboutDesk'
import { AgentCrew } from './stations/AgentCrew'
import { useRoom } from '../store'

RectAreaLightUniformsLib.init()

function Lights() {
  return (
    <>
      <ambientLight intensity={0.18} color="#8090c0" />
      <hemisphereLight args={['#6b7cff', '#2a1a10', 0.35]} />
      <directionalLight
        castShadow
        position={[-5, 9, 6]}
        intensity={1.1}
        color="#c9d6ff"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <pointLight position={[0, 3.6, 1]} intensity={6} distance={10} color="#ffcf9a" />
    </>
  )
}

function Effects({ lite }: { lite: boolean }) {
  if (lite)
    return (
      <EffectComposer multisampling={0}>
        <Outline visibleEdgeColor={0xffd9a8} hiddenEdgeColor={0x553a20} edgeStrength={4} blur width={1400} />
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.2} radius={0.7} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    )
  return (
    <EffectComposer multisampling={0}>
      <N8AO halfRes aoRadius={0.6} intensity={2.2} distanceFalloff={0.8} color="#05060a" />
      <Outline visibleEdgeColor={0xffd9a8} hiddenEdgeColor={0x553a20} edgeStrength={4} blur width={1400} />
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.25} darkness={0.75} />
      <SMAA />
    </EffectComposer>
  )
}

export function Experience() {
  const go = useRoom((s) => s.go)
  const station = useRoom((s) => s.station)
  const lite = useRoom((s) => s.lite)
  const setLite = useRoom((s) => s.setLite)
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? 1 : [1, 2]}
      camera={{ fov: 38, near: 0.1, far: 80, position: [6, 10, 20] }}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onPointerMissed={() => station !== 'overview' && useRoom.getState().paperId === null && go('overview')}
    >
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 16, 34]} />
      <PerformanceMonitor onDecline={() => setLite(true)} flipflops={2} />
      <Suspense fallback={null}>
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={1.2} color="#ffd2a1" position={[0, 5, -9]} scale={[10, 3, 1]} />
          <Lightformer intensity={0.8} color="#8aa0ff" position={[-9, 3, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={0.6} color="#ff9ad5" position={[9, 3, 0]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          <Lightformer intensity={2} form="ring" color="#ffffff" position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={4} />
        </Environment>
        <Selection>
          <Lights />
          <Room />
          <Library />
          <TradingDesk />
          <SecurityLab />
          <MonitorWall />
          <SwarmTable />
          <Basketball />
          <AboutDesk />
          <AgentCrew />
          <Effects lite={lite} />
        </Selection>
        <Preload all />
      </Suspense>
      <CameraRig />
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  )
}
