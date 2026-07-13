import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export default function VehicleBody({ position = [0, 0, 0], soc = 0, lateralOffset = 0, isActive = false }) {
  const batteryGlowRef = useRef()
  const offsetX = lateralOffset * 0.05

  useFrame(() => {
    if (batteryGlowRef.current) {
      batteryGlowRef.current.material.emissiveIntensity = isActive ? 0.8 + Math.sin(Date.now() * 0.003) * 0.3 : 0.4
    }
  })

  const socNorm = soc / 100
  const battR = 1 - socNorm
  const battG = socNorm

  return (
    <group position={[position[0] + offsetX, position[1], position[2]]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.4, 0.5, 1.8]} />
        <meshStandardMaterial color="#2563eb" emissive="#1d4ed8" emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
      </mesh>

      <mesh position={[-0.2, 0.4, 0]}>
        <boxGeometry args={[2.0, 0.45, 1.7]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e3a8a" emissiveIntensity={0.2} transparent opacity={0.6} roughness={0.2} metalness={0.3} />
      </mesh>

      <mesh position={[0.7, 0.38, 0]}>
        <boxGeometry args={[0.6, 0.4, 1.65]} />
        <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.15} transparent opacity={0.35} roughness={0.1} metalness={0.2} />
      </mesh>

      <mesh position={[1.2, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.15, 1.7]} />
        <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={0.2} roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[-1.2, 0.08, 0]}>
        <boxGeometry args={[0.7, 0.12, 1.7]} />
        <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={0.2} roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[1.7, 0.05, 0.55]}>
        <boxGeometry args={[0.08, 0.1, 0.25]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={isActive ? 1.2 : 0.5} />
      </mesh>
      <mesh position={[1.7, 0.05, -0.55]}>
        <boxGeometry args={[0.08, 0.1, 0.25]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={isActive ? 1.2 : 0.5} />
      </mesh>

      <mesh position={[-1.7, 0.05, 0.55]}>
        <boxGeometry args={[0.08, 0.1, 0.25]} />
        <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-1.7, 0.05, -0.55]}>
        <boxGeometry args={[0.08, 0.1, 0.25]} />
        <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>

      {[[-1.1, -0.3, 0.85], [1.1, -0.3, 0.85], [-1.1, -0.3, -0.85], [1.1, -0.3, -0.85]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.15, 16]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} metalness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.16, 8]} />
            <meshStandardMaterial color="#6b7280" roughness={0.5} metalness={0.7} />
          </mesh>
        </group>
      ))}

      <group position={[0, -0.25, 0]}>
        <mesh ref={batteryGlowRef}>
          <boxGeometry args={[2.2, 0.1, 1.0]} />
          <meshStandardMaterial
            color={new THREE.Color(battR * 0.7 + 0.1, battG * 0.7 + 0.1, 0.1)}
            emissive={new THREE.Color(battR * 0.8, battG * 0.8, 0)}
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      <mesh position={[-0.2, 0.65, 0.82]}>
        <boxGeometry args={[1.6, 0.03, 0.03]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.2, 0.65, -0.82]}>
        <boxGeometry args={[1.6, 0.03, 0.03]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.3} />
      </mesh>

      <Text position={[0, 0.9, 0]} fontSize={0.2} color="#bfdbfe" anchorX="center">
        Electric Vehicle
      </Text>
      <Text position={[0, -0.55, 0]} fontSize={0.14} color="#93c5fd" anchorX="center">
        {soc.toFixed(1)}% SOC
      </Text>
    </group>
  )
}
