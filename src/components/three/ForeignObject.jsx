import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../../store/simulationStore'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export default function ForeignObject({ txCoilY, rxCoilY }) {
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  const vehicle = useStore(s => s.currentVehicle)

  const fodData = useMemo(() => {
    const seed = vehicle ? hashString(vehicle.id) : 12345
    const rng = seededRandom(seed)

    const midY = (txCoilY + rxCoilY) / 2
    const posX = (rng() - 0.5) * 1.2
    const posY = midY + (rng() - 0.5) * 0.6
    const posZ = (rng() - 0.5) * 0.8

    const w = 0.12 + rng() * 0.2
    const h = 0.03 + rng() * 0.06
    const d = 0.08 + rng() * 0.15

    return {
      position: [posX, posY, posZ],
      dimensions: [w, h, d],
      posCm: {
        x: Math.round(posX * 100),
        y: Math.round(posY * 100),
        z: Math.round(posZ * 100),
      },
      dimCm: {
        w: Math.round(w * 100),
        h: Math.round(h * 100),
        d: Math.round(d * 100),
      },
    }
  }, [vehicle, txCoilY, rxCoilY])

  useFrame(() => {
    if (glowRef.current) {
      const t = Date.now() * 0.003
      glowRef.current.material.opacity = 0.25 + Math.sin(t * 2) * 0.2
      glowRef.current.scale.set(
        1 + Math.sin(t * 1.5) * 0.04,
        1 + Math.sin(t * 1.5) * 0.04,
        1 + Math.sin(t * 1.5) * 0.04,
      )
    }
  })

  const [px, py, pz] = fodData.position
  const [w, h, d] = fodData.dimensions

  return (
    <group position={fodData.position}>
      <mesh
        rotation={[0.1, 0.3, 0.05]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color="#555555"
          emissive={hovered ? '#ff1744' : '#ff1744'}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[0.1, 0.3, 0.05]}>
        <boxGeometry args={[w + 0.06, h + 0.06, d + 0.06]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.2} side={THREE.BackSide} />
      </mesh>

      <pointLight color="#ff1744" intensity={hovered ? 1.5 : 0.8} distance={3} />

      {hovered && (
        <Html position={[0, h / 2 + 0.25, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(183,28,28,0.92)',
            border: '1px solid #ff5252',
            borderRadius: 4,
            padding: '3px 7px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            <div style={{ color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>
              ⚠ FOREIGN OBJECT DETECTED
            </div>
            <div style={{ color: '#ffab40', fontSize: 9, marginTop: 2 }}>
              Position: (X: {fodData.posCm.x}cm, Y: {fodData.posCm.y}cm, Z: {fodData.posCm.z}cm)
            </div>
            <div style={{ color: '#ffab40', fontSize: 9 }}>
              Dimensions: W: {fodData.dimCm.w}cm × H: {fodData.dimCm.h}cm × D: {fodData.dimCm.d}cm
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
