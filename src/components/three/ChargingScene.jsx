import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../../store/simulationStore'
import useChargingSimBinding from '../../hooks/useChargingSimBinding'
import { StageBlock, CoilGeometry, WirePath, Capacitor, AcSource } from './CircuitComponents'
import { MagneticFieldLines, MagneticFieldParticles } from './FieldEffects'
import VehicleBody from './VehicleBody'
import ForeignObject from './ForeignObject'

function GroundPad() {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#0c1929" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 3.0, 48]} />
        <meshStandardMaterial color="#1a237e" emissive="#3f51b5" emissiveIntensity={0.2} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function AirGapIndicator({ txY, rxY, lateralOffset = 0, couplingK = 0.85 }) {
  const offsetX = lateralOffset * 0.05
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-0.15 + offsetX, txY + 0.3, 0, -0.15 + offsetX, rxY - 0.3, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffab40" transparent opacity={0.5} />
      </line>
      <Text position={[-0.8 + offsetX, (txY + rxY) / 2, 0.5]} fontSize={0.15} color="#ffab40" anchorX="center">
        {`k=${couplingK.toFixed(2)}`}
      </Text>
    </group>
  )
}

function SceneContent({ showLabels }) {
  const binding = useChargingSimBinding()
  const cases = useStore(s => s.cases)

  const damagedSet = useMemo(() => {
    const s = new Set()
    const CASE_COMPONENTS = {
      fod: ['tx-coil', 'rx-coil'],
      capacitor: ['c1', 'c2'],
      misalignment: ['tx-coil', 'rx-coil'],
      inverter: ['hf-inverter'],
      aging: ['ac-dc', 'hf-inverter'],
      electrical: ['ac-source', 'ac-dc', 'hf-rectifier', 'dcdc', 'battery'],
      thermal: ['c1', 'c2', 'hf-inverter', 'ac-dc'],
    }
    for (const [caseId, comps] of Object.entries(CASE_COMPONENTS)) {
      if (cases[caseId]?.status === 'active') {
        comps.forEach(c => s.add(c))
      }
    }
    return s
  }, [cases])

  const groundY = -0.2
  const vehicleLevelY = 3.0
  const txCoilY = groundY + 0.15
  const rxCoilY = vehicleLevelY - 0.9
  const lateralOffset = binding.lateralDistance

  const stationWire = [[-10, groundY, 0], [-8.8, groundY, 0]]
  const acdcToC1 = [[-6.3, groundY, 0], [-5.0, groundY, 0]]
  const c1ToInv = [[-4.5, groundY, 0], [-3.2, groundY, 0]]
  const invToTx = [[-3.2, groundY, 0], [-1.5, groundY, 0], [0, txCoilY, 0]]

  const rxOff = lateralOffset * 0.05
  const rxToRect = [[1.5 + rxOff, rxCoilY, 0], [3.5 + rxOff, rxCoilY, 0]]
  const rectToC2 = [[6.0 + rxOff, rxCoilY, 0], [6.8 + rxOff, rxCoilY, 0]]
  const c2ToDcdc = [[6.8 + rxOff, rxCoilY, 0], [8.8 + rxOff, rxCoilY, 0]]
  const dcdcToBatt = [[8.8 + rxOff, rxCoilY, 0], [10.5 + rxOff, rxCoilY, 0]]

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 8, 5]} intensity={1.0} color="#e8eaf6" />
      <pointLight position={[-8, 4, 3]} intensity={0.6} color="#42a5f5" />
      <pointLight position={[8, 4, 3]} intensity={0.6} color="#ff9800" />
      <pointLight position={[0, 1, 6]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#e3f2fd" />

      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={35}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 1.2, 0]}
      />

      <Grid
        position={[0, -0.55, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a237e"
        sectionSize={5}
        sectionColor="#283593"
        fadeDistance={30}
        infiniteGrid
      />

      <GroundPad />

      {/* GROUND LEVEL: Station side */}
      <AcSource position={[-10, groundY, 0]} voltage={binding.gridAC.voltage} isActive={binding.isActive} isDamaged={damagedSet.has('ac-source')} />
      <StageBlock position={[-7.5, groundY, 0]} label="AC/DC" subLabel={`${binding.dcBus.voltage.toFixed(0)}V`} power={binding.dcBus.power} maxPower={binding.maxPower} showLabel={showLabels} color="#1a237e" glowColor="#42a5f5" isDamaged={damagedSet.has('ac-dc')} />
      <Capacitor position={[-5.8, groundY, 0]} label="C1" voltage={binding.dcBus.voltage} showLabel={showLabels} isDamaged={damagedSet.has('c1')} />
      <StageBlock position={[-4.2, groundY, 0]} label="HF Inverter" subLabel={`${(binding.hfAC.frequency / 1000).toFixed(0)}kHz`} power={binding.hfAC.power} maxPower={binding.maxPower} showLabel={showLabels} color="#4a148c" glowColor="#ce93d8" isDamaged={damagedSet.has('hf-inverter')} />
      <CoilGeometry position={[0, txCoilY, 0]} radius={1.2} turns={6} current={binding.txCoil.current} facing="up" showLabel={showLabels} label="Emetteur (Tx)" color="#ff8c00" isDamaged={damagedSet.has('tx-coil')} />

      {/* VEHICLE LEVEL: Receiver side */}
      <CoilGeometry position={[0 + rxOff, rxCoilY, 0]} radius={1.0} turns={5} current={binding.rxCoil.current} facing="down" showLabel={showLabels} label="Recepteur (Rx)" color="#ff6d00" isDamaged={damagedSet.has('rx-coil')} />
      <StageBlock position={[4.5 + rxOff, rxCoilY, 0]} label="HF Rectifier" subLabel={`${binding.rectDc.voltage.toFixed(0)}V`} power={binding.rectDc.power} maxPower={binding.maxPower} showLabel={showLabels} color="#b71c1c" glowColor="#ef5350" isDamaged={damagedSet.has('hf-rectifier')} />
      <Capacitor position={[6.2 + rxOff, rxCoilY, 0]} label="C2" voltage={binding.rectDc.voltage} showLabel={showLabels} isDamaged={damagedSet.has('c2')} />
      <StageBlock position={[7.5 + rxOff, rxCoilY, 0]} label="DC/DC" subLabel={`${binding.dcdcOut.voltage.toFixed(0)}V`} power={binding.dcdcOut.power} maxPower={binding.maxPower} showLabel={showLabels} color="#e65100" glowColor="#ff9800" isDamaged={damagedSet.has('dcdc')} />
      <StageBlock position={[10 + rxOff, rxCoilY, 0]} label="Battery" subLabel={`${binding.soc.toFixed(1)}%`} power={binding.battery.power} maxPower={binding.maxPower} showLabel={showLabels} color="#1b5e20" glowColor={binding.soc > 80 ? '#66bb6a' : binding.soc > 30 ? '#ffa726' : '#ef5350'} isDamaged={damagedSet.has('battery')} />

      <VehicleBody position={[7 + rxOff, rxCoilY + 1.2, 0]} soc={binding.soc} lateralOffset={lateralOffset} isActive={binding.isActive} />

      {/* Magnetic Field */}
      {binding.isActive && binding.txCoil.power > 0 && (
        <>
          <MagneticFieldLines
            txPosition={[0, txCoilY + 0.2, 0]}
            rxPosition={[0, rxCoilY - 0.2, 0]}
            power={binding.txCoil.power}
            maxPower={binding.maxPower}
            couplingK={binding.couplingK}
            lateralOffset={lateralOffset}
          />
          <MagneticFieldParticles
            txPosition={[0, txCoilY + 0.2, 0]}
            rxPosition={[0, rxCoilY - 0.2, 0]}
            power={binding.txCoil.power}
            maxPower={binding.maxPower}
            couplingK={binding.couplingK}
            lateralOffset={lateralOffset}
          />
        </>
      )}

      <AirGapIndicator txY={txCoilY} rxY={rxCoilY} lateralOffset={lateralOffset} couplingK={binding.couplingK} />

      {cases.fod?.status === 'active' && (
        <ForeignObject txCoilY={txCoilY} rxCoilY={rxCoilY} />
      )}

      {/* Wire paths - Ground side */}
      <WirePath points={stationWire} color="#4caf50" power={binding.gridAC.power} maxPower={binding.maxPower} />
      <WirePath points={acdcToC1} color="#42a5f5" power={binding.dcBus.power} maxPower={binding.maxPower} />
      <WirePath points={c1ToInv} color="#42a5f5" power={binding.dcBus.power} maxPower={binding.maxPower} />
      <WirePath points={invToTx} color="#ce93d8" power={binding.hfAC.power} maxPower={binding.maxPower} />

      {/* Wire paths - Vehicle side */}
      <WirePath points={rxToRect} color="#ff6d00" power={binding.rxCoil.power} maxPower={binding.maxPower} />
      <WirePath points={rectToC2} color="#ef5350" power={binding.rectDc.power} maxPower={binding.maxPower} />
      <WirePath points={c2ToDcdc} color="#ef5350" power={binding.rectDc.power} maxPower={binding.maxPower} />
      <WirePath points={dcdcToBatt} color="#ff9800" power={binding.dcdcOut.power} maxPower={binding.maxPower} />

      <Text position={[-10, groundY - 1.0, 0]} fontSize={0.18} color="#4fc3f7" anchorX="center">
        --- STATION (Ground) ---
      </Text>
      <Text position={[0, rxCoilY + 2.2, 0]} fontSize={0.18} color="#64b5f6" anchorX="center">
        --- VEHICLE (Above) ---
      </Text>
    </>
  )
}

export default function ChargingScene({ showLabels = true }) {
  return (
    <Canvas
      camera={{ position: [0, 6, 18], fov: 45 }}
      style={{ background: '#050510' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <SceneContent showLabels={showLabels} />
      </Suspense>
    </Canvas>
  )
}
