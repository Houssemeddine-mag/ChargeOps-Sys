import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Cylinder, Torus, Html } from '@react-three/drei'
import * as THREE from 'three'

function DamageIndicator({ position = [0.7, 0.7, 0] }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) {
      const t = Date.now() * 0.004
      ref.current.scale.setScalar(1 + Math.sin(t * 2) * 0.12)
    }
  })
  return (
    <group ref={ref} position={position}>
      <Html center style={{ pointerEvents: 'none' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'radial-gradient(circle, #ff1744, #b71c1c)',
          border: '2px solid #ff5252',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, color: 'white', lineHeight: 1,
          boxShadow: '0 0 10px rgba(255,23,68,0.9), 0 0 20px rgba(255,23,68,0.4)',
        }}>!</div>
      </Html>
    </group>
  )
}

export function StageBlock({ position, label, subLabel, color = '#1e3a5f', glowColor = '#4fc3f7', power = 0, maxPower = 40000, showLabel = true, isDamaged = false }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const intensity = Math.min(1, power / Math.max(maxPower, 1))

  useFrame((_, delta) => {
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.08 + intensity * 0.15 + Math.sin(Date.now() * 0.003) * 0.03
    }
    if (meshRef.current) {
      meshRef.current.material.emissiveIntensity = 0.2 + intensity * 0.8
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.8, 1.0, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.2 + intensity * 0.8}
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <boxGeometry args={[2.0, 1.2, 0.8]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.1} side={THREE.BackSide} />
      </mesh>
      {showLabel && (
        <Text
          position={[0, 0.75, 0]}
          fontSize={0.22}
          color="#90caf9"
          anchorX="center"
          anchorY="bottom"
          maxWidth={3}
        >
          {label}
        </Text>
      )}
      {showLabel && subLabel && (
        <Text
          position={[0, 0, 0.35]}
          fontSize={0.15}
          color="#64b5f6"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
        >
          {subLabel}
        </Text>
      )}
      {isDamaged && <DamageIndicator position={[0.7, 0.7, 0]} />}
    </group>
  )
}

export function CoilGeometry({ position, radius = 1.2, turns = 6, thickness = 0.08, color = '#ff8c00', current = 0, facing = 'up', showLabel = true, label = 'Coil', isDamaged = false }) {
  const groupRef = useRef()
  const ringsRef = useRef([])

  const intensity = Math.min(1, current / 30)

  const rings = useMemo(() => {
    const r = []
    for (let i = 0; i < turns; i++) {
      const t = (i + 1) / (turns + 1)
      r.push(radius * t)
    }
    return r
  }, [radius, turns])

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.material && i < rings.length) {
          child.material.emissiveIntensity = 0.4 + intensity * 1.2 + Math.sin(Date.now() * 0.005 + i * 0.5) * 0.2
        }
      })
    }
  })

  const rotX = facing === 'up' ? -Math.PI / 2 : Math.PI / 2
  const labelY = facing === 'up' ? 0.4 : -0.4

  return (
    <group position={position}>
      <group ref={groupRef} rotation={[rotX, 0, 0]}>
        {rings.map((r, i) => (
          <mesh key={i} position={[0, 0, 0]}>
            <torusGeometry args={[r, thickness, 8, 48]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.4 + intensity * 1.2}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        ))}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[radius + 0.1, radius + 0.1, 0.05, 32, 1, true]} />
          <meshStandardMaterial
            color="#2a1a00"
            emissive={color}
            emissiveIntensity={0.1}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {showLabel && (
        <Text
          position={[0, labelY, 0]}
          fontSize={0.2}
          color="#ffb74d"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
      {isDamaged && <DamageIndicator position={[0, facing === 'up' ? 0.6 : -0.6, 0]} />}
    </group>
  )
}

export function WirePath({ points, color = '#4fc3f7', speed = 1, power = 0, maxPower = 40000 }) {
  const tubeRef = useRef()
  const intensity = Math.min(1, power / Math.max(maxPower, 1))

  const curve = useMemo(() => {
    const pts = points.map(p => new THREE.Vector3(...p))
    if (pts.length < 2) return null
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
  }, [points])

  if (!curve) return null

  const tubePoints = curve.getPoints(32)

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={tubePoints.length}
            array={new Float32Array(tubePoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={1} transparent opacity={0.3 + intensity * 0.5} />
      </line>
    </group>
  )
}

export function Capacitor({ position, label = 'C', voltage = 0, showLabel = true, isDamaged = false }) {
  const intensity = Math.min(1, Math.abs(voltage) / 450)
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#1a237e" emissive="#42a5f5" emissiveIntensity={0.2 + intensity * 0.6} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#1a237e" emissive="#42a5f5" emissiveIntensity={0.2 + intensity * 0.6} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 24]} />
        <meshStandardMaterial color="#0d47a1" emissive="#2196f3" emissiveIntensity={0.1 + intensity * 0.3} transparent opacity={0.6} metalness={0.5} roughness={0.4} />
      </mesh>
      {showLabel && (
        <Text position={[0, 0.55, 0]} fontSize={0.18} color="#90caf9" anchorX="center">
          {label}
        </Text>
      )}
      {isDamaged && <DamageIndicator position={[0.4, 0.5, 0]} />}
    </group>
  )
}

export function AcSource({ position, voltage = 220, isActive = false, isDamaged = false }) {
  const waveRef = useRef()
  const intensity = isActive ? 1 : 0.2

  useFrame(() => {
    if (waveRef.current) {
      const t = Date.now() * 0.003
      waveRef.current.rotation.z = t
      waveRef.current.material.emissiveIntensity = isActive ? 0.8 + Math.sin(t * 3) * 0.3 : 0.2
    }
  })

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial color="#1b5e20" emissive="#4caf50" emissiveIntensity={intensity * 0.6} transparent opacity={0.85} metalness={0.4} />
      </mesh>
      <mesh ref={waveRef} position={[0, 0, 0.3]}>
        <torusGeometry args={[0.2, 0.025, 8, 32]} />
        <meshStandardMaterial color="#66bb6a" emissive="#66bb6a" emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 0.7, 0]} fontSize={0.2} color="#81c784" anchorX="center">
        AC Source
      </Text>
      <Text position={[0, -0.7, 0]} fontSize={0.14} color="#a5d6a7" anchorX="center">
        {voltage.toFixed(0)}V / 50Hz
      </Text>
      {isDamaged && <DamageIndicator position={[0.4, 0.5, 0]} />}
    </group>
  )
}
