import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_FIELD_LINES = 20
const MAX_PARTICLES = 120

export function MagneticFieldLines({ txPosition, rxPosition, power = 0, maxPower = 40000, couplingK = 0.85, lateralOffset = 0 }) {
  const linesRef = useRef()
  const materialRefs = useRef([])
  const intensity = Math.min(1, power / Math.max(maxPower, 1))

  const lineData = useMemo(() => {
    const lines = []
    const count = Math.max(3, Math.floor(MAX_FIELD_LINES * Math.max(0.15, intensity)))
    const txX = txPosition[0]
    const txY = txPosition[1]
    const txZ = txPosition[2]
    const rxX = rxPosition[0] + lateralOffset * 0.05
    const rxY = rxPosition[1]
    const rxZ = rxPosition[2]

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const spreadX = Math.cos(angle) * 0.6
      const spreadZ = Math.sin(angle) * 0.6
      const midY = (txY + rxY) / 2
      const bulge = 0.3 + (1 - couplingK) * 0.5

      const pts = []
      const segments = 20
      for (let j = 0; j <= segments; j++) {
        const t = j / segments
        const x = txX + (rxX - txX) * t + spreadX * Math.sin(t * Math.PI)
        const z = txZ + (rxZ - txZ) * t + spreadZ * Math.sin(t * Math.PI)
        const yBase = txY + (rxY - txY) * t
        const bulgeY = Math.sin(t * Math.PI) * bulge
        pts.push(new THREE.Vector3(x, yBase + bulgeY, z))
      }
      lines.push(pts)
    }
    return lines
  }, [txPosition, rxPosition, couplingK, lateralOffset, Math.round(intensity * 10)])

  useFrame((state) => {
    if (!linesRef.current) return
    const t = state.clock.elapsedTime
    linesRef.current.children.forEach((lineGroup, i) => {
      if (lineGroup.children[0]?.material) {
        const mat = lineGroup.children[0].material
        const phase = Math.sin(t * 2 + i * 0.3) * 0.3
        mat.opacity = Math.max(0.05, (0.15 + intensity * 0.5 + phase) * (couplingK * 0.8 + 0.2))
        mat.color.setHSL(0.72 + Math.sin(t + i) * 0.03, 0.8, 0.5 + intensity * 0.2)
      }
    })
  })

  return (
    <group ref={linesRef}>
      {lineData.map((pts, i) => {
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3)
        const tubePts = curve.getPoints(30)
        return (
          <group key={i}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={tubePts.length}
                  array={new Float32Array(tubePts.flatMap(p => [p.x, p.y, p.z]))}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#7c4dff"
                transparent
                opacity={0.3}
                linewidth={1}
              />
            </line>
          </group>
        )
      })}
    </group>
  )
}

export function EnergyParticles({ pathPoints, power = 0, maxPower = 40000, color = '#4fc3f7', speed = 1, particleCount = 40 }) {
  const pointsRef = useRef()
  const positionsRef = useRef(null)
  const offsetsRef = useRef(null)
  const intensity = Math.min(1, power / Math.max(maxPower, 1))
  const count = Math.max(5, Math.floor(particleCount * Math.max(0.2, intensity * speed)))

  const curve = useMemo(() => {
    if (pathPoints.length < 2) return null
    const pts = pathPoints.map(p => new THREE.Vector3(...p))
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3)
  }, [pathPoints])

  useMemo(() => {
    if (!curve) return
    const posArr = new Float32Array(MAX_PARTICLES * 3)
    const offArr = new Float32Array(MAX_PARTICLES)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      offArr[i] = Math.random()
    }
    positionsRef.current = posArr
    offsetsRef.current = offArr
  }, [curve])

  useFrame((state) => {
    if (!pointsRef.current || !curve || !positionsRef.current) return
    const t = state.clock.elapsedTime
    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position')
    if (!posAttr) return

    const arr = posAttr.array
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < count) {
        const offset = offsetsRef.current[i]
        const tt = ((t * speed * 0.3 + offset) % 1 + 1) % 1
        const point = curve.getPoint(tt)
        arr[i * 3] = point.x + (Math.random() - 0.5) * 0.02
        arr[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.02
        arr[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.02
      } else {
        arr[i * 3] = 1000
        arr[i * 3 + 1] = 1000
        arr[i * 3 + 2] = 1000
      }
    }
    posAttr.needsUpdate = true
  })

  if (!curve) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={positionsRef.current || new Float32Array(MAX_PARTICLES * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08 + intensity * 0.06}
        transparent
        opacity={0.6 + intensity * 0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function MagneticFieldParticles({ txPosition, rxPosition, power = 0, maxPower = 40000, couplingK = 0.85, lateralOffset = 0 }) {
  const pointsRef = useRef()
  const count = 80
  const offsetsRef = useRef(null)
  const intensity = Math.min(1, power / Math.max(maxPower, 1))

  useMemo(() => {
    const off = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      off[i * 4] = Math.random()
      off[i * 4 + 1] = (Math.random() - 0.5) * 0.8
      off[i * 4 + 2] = (Math.random() - 0.5) * 0.8
      off[i * 4 + 3] = Math.random() * Math.PI * 2
    }
    offsetsRef.current = off
  }, [])

  useFrame((state) => {
    if (!pointsRef.current || !offsetsRef.current) return
    const t = state.clock.elapsedTime
    const geo = pointsRef.current.geometry
    const posAttr = geo.getAttribute('position')
    if (!posAttr) return
    const arr = posAttr.array

    const txX = txPosition[0]
    const txY = txPosition[1]
    const rxY = rxPosition[1]

    for (let i = 0; i < count; i++) {
      const phase = (offsetsRef.current[i * 4] + t * 0.2 * couplingK) % 1
      const sx = offsetsRef.current[i * 4 + 1]
      const sz = offsetsRef.current[i * 4 + 2]
      const txZ = txPosition[2]

      arr[i * 3] = txX + sx + lateralOffset * 0.05 * phase
      arr[i * 3 + 1] = txY + (rxY - txY) * phase + Math.sin(phase * Math.PI) * 0.3
      arr[i * 3 + 2] = txZ + sz
    }
    posAttr.needsUpdate = true
  })

  const posArray = useMemo(() => new Float32Array(count * 3).fill(1000), [])

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={posArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#b388ff"
        size={0.06}
        transparent
        opacity={0.4 + intensity * 0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
