import { useState, useEffect } from 'react'
import useStore from '../store/simulationStore'
import useChargingSimBinding from '../hooks/useChargingSimBinding'
import ChargingScene from '../components/three/ChargingScene'
import CaseDetail from '../components/CaseDetail'
import { CaseIcon, BatteryIcon } from '../utils/icons'

const CASE_META = {
  normal: { title: 'Normal Diagnosis', icon: 'normal', color: '#4caf50' },
  fod: { title: 'FOD', icon: 'fod', color: '#ef5350' },
  capacitor: { title: 'Capacitor', icon: 'capacitor', color: '#ffa726' },
  misalignment: { title: 'Misalignment', icon: 'misalignment', color: '#ef5350' },
  inverter: { title: 'Inverter', icon: 'inverter', color: '#ef5350' },
  aging: { title: 'Aging', icon: 'aging', color: '#ffa726' },
  electrical: { title: 'Electrical', icon: 'electrical', color: '#ef5350' },
  thermal: { title: 'Thermal', icon: 'thermal', color: '#ffa726' },
}

function WaveformCanvas({ data, color = '#4fc3f7', label = '', height = 55 }) {
  const w = 170
  const h = height
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = Math.max(Math.abs(max - Math.abs(min)), 1)
  const mid = h / 2

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = mid - (v / range) * (mid - 4)
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <div className="text-[9px] text-gray-500 mb-0.5">{label}</div>
      <svg width={w} height={h} className="rounded border border-gray-700/40 bg-gray-900/70">
        <line x1={0} y1={mid} x2={w} y2={mid} stroke="#222" strokeWidth={0.5} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={1} opacity={0.85} />
      </svg>
    </div>
  )
}

function StageReadout({ label, values, color = '#4fc3f7' }) {
  return (
    <div className="px-2 py-1.5 rounded bg-gray-800/50 border border-gray-700/30">
      <div className="text-[10px] font-semibold mb-0.5" style={{ color }}>{label}</div>
      {values.map((v, i) => (
        <div key={i} className="text-[10px] text-gray-300 flex justify-between gap-1">
          <span className="text-gray-500">{v.label}</span>
          <span className="font-mono">{v.value}</span>
        </div>
      ))}
    </div>
  )
}

function DataHUD({ binding }) {
  return (
    <div className="absolute top-12 right-2 w-52 space-y-1.5 max-h-[calc(100vh-100px)] overflow-y-auto z-10 pointer-events-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-[10px] font-bold text-gray-300 mb-1.5 border-b border-gray-700/50 pb-1">Live Readouts</div>
        <div className="space-y-1">
          <StageReadout label="Grid AC" color="#66bb6a" values={[
            { label: 'V', value: `${binding.gridAC.voltage.toFixed(1)} V` },
            { label: 'I', value: `${binding.gridAC.current.toFixed(1)} A` },
            { label: 'P', value: `${(binding.gridAC.power / 1000).toFixed(1)} kW` },
          ]} />
          <StageReadout label="DC Bus" color="#42a5f5" values={[
            { label: 'V', value: `${binding.dcBus.voltage.toFixed(1)} V` },
            { label: 'I', value: `${binding.dcBus.current.toFixed(1)} A` },
            { label: 'Eff', value: `${(binding.efficiency.acDc * 100).toFixed(1)}%` },
          ]} />
          <StageReadout label="HF AC" color="#ce93d8" values={[
            { label: 'V', value: `${binding.hfAC.voltage.toFixed(1)} V` },
            { label: 'f', value: `${(binding.hfAC.frequency / 1000).toFixed(0)} kHz` },
          ]} />
          <StageReadout label="Coupling" color="#ff8c00" values={[
            { label: 'k', value: binding.couplingK.toFixed(3) },
            { label: 'P_tx', value: `${(binding.txCoil.power / 1000).toFixed(1)} kW` },
            { label: 'P_rx', value: `${(binding.rxCoil.power / 1000).toFixed(1)} kW` },
          ]} />
          <StageReadout label="Rectified" color="#ef5350" values={[
            { label: 'V', value: `${binding.rectDc.voltage.toFixed(1)} V` },
            { label: 'Eff', value: `${(binding.efficiency.hfRectifier * 100).toFixed(1)}%` },
          ]} />
          <StageReadout label="DC/DC Out" color="#ff9800" values={[
            { label: 'V', value: `${binding.dcdcOut.voltage.toFixed(1)} V` },
            { label: 'I', value: `${binding.dcdcOut.current.toFixed(1)} A` },
          ]} />
          <StageReadout label="Battery" color="#66bb6a" values={[
            { label: 'V', value: `${binding.battery.voltage.toFixed(1)} V` },
            { label: 'SOC', value: `${binding.soc.toFixed(1)}%` },
            { label: 'Total η', value: `${(binding.efficiency.overall * 100).toFixed(1)}%` },
          ]} />
        </div>
      </div>
      <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-[10px] font-bold text-gray-300 mb-1.5 border-b border-gray-700/50 pb-1">Waveforms</div>
        <div className="space-y-1">
          <WaveformCanvas data={binding.waveforms.grid} color="#66bb6a" label="Grid AC" />
          <WaveformCanvas data={binding.waveforms.hf} color="#ce93d8" label="HF Inverter" />
          <WaveformCanvas data={binding.waveforms.rx} color="#ff6d00" label="Rx Induced" />
          <WaveformCanvas data={binding.waveforms.dcdc} color="#ff9800" label="DC/DC Output" />
        </div>
      </div>
    </div>
  )
}

function AlignmentControl() {
  const vehicle = useStore(s => s.currentVehicle)
  const updateVehicleParam = useStore(s => s.updateVehicleParam)
  if (!vehicle) return null
  const p = vehicle.params

  return (
    <div className="absolute bottom-2 left-2 z-10 pointer-events-auto">
      <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-2.5 backdrop-blur-sm w-56">
        <div className="text-[10px] font-bold text-gray-300 mb-1.5 border-b border-gray-700/50 pb-1">Alignment Control</div>
        <div className="space-y-1.5">
          {[
            { key: 'airGap', label: 'Air Gap', min: 15, max: 50, unit: 'cm' },
            { key: 'lateralDistance', label: 'Lateral Offset', min: 0, max: 25, unit: 'cm' },
            { key: 'angle', label: 'Angular Offset', min: 0, max: 15, unit: 'deg' },
          ].map(s => (
            <div key={s.key}>
              <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                <span>{s.label}</span>
                <span className="font-mono">{p[s.key].toFixed(1)} {s.unit}</span>
              </div>
              <input
                type="range" min={s.min} max={s.max} step={0.5}
                value={p[s.key]}
                onChange={e => updateVehicleParam(s.key, parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #4caf50 0%, #4caf50 ${((p[s.key] - s.min) / (s.max - s.min)) * 100}%, #333 ${((p[s.key] - s.min) / (s.max - s.min)) * 100}%, #333 100%)` }}
              />
            </div>
          ))}
          <div className="flex justify-between items-center pt-1 border-t border-gray-700/50">
            <span className="text-[9px] text-gray-500">Coupling k</span>
            <span className={`text-xs font-mono font-bold ${p.couplingK >= 0.75 ? 'text-green-400' : 'text-red-400'}`}>
              {p.couplingK.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeftPanel({ binding }) {
  const [caseDetailId, setCaseDetailId] = useState(null)
  const cases = useStore(s => s.cases)
  const startCharging = useStore(s => s.startCharging)
  const charging = useStore(s => s.charging)
  const resolveAllCases = useStore(s => s.resolveAllCases)

  const activeBlockers = Object.values(cases).filter(c => c.blocksCharging && c.status === 'active')

  const statusColor = {
    idle: 'text-gray-400',
    ready: 'text-blue-400',
    charging: 'text-green-400',
    blocked: 'text-red-400',
    complete: 'text-yellow-400',
  }[charging.status] || 'text-gray-400'

  const statusLabel = {
    idle: 'No vehicle',
    ready: 'Ready to charge',
    charging: charging.speed < 0.5 ? 'Charging (degraded)' : 'Charging',
    blocked: `Blocked: ${activeBlockers.map(b => b.caseId).join(', ')}`,
    complete: 'Complete',
  }[charging.status] || ''

  return (
    <>
      <div className="absolute top-12 left-2 z-10 pointer-events-auto w-56 max-h-[calc(100vh-100px)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="space-y-1.5">
          {/* Charging Control */}
          <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BatteryIcon className={`w-3.5 h-3.5 ${
                charging.status === 'charging' ? 'text-green-400' :
                charging.status === 'blocked' ? 'text-red-400' : 'text-blue-400'
              }`} />
              <span className="text-[10px] font-bold text-gray-300">Charging</span>
              <span className={`text-[9px] font-medium ml-auto ${statusColor}`}>{statusLabel}</span>
            </div>

            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50 mb-1.5">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  charging.status === 'charging' ? 'animate-shimmer' : ''
                }`}
                style={{
                  width: `${Math.max(0, ((charging.currentBattery - charging.entryBattery) / Math.max(1, 100 - charging.entryBattery)) * 100)}%`,
                  background: charging.status === 'blocked' ? 'linear-gradient(90deg, #dc2626, #ef4444)' :
                    charging.status === 'complete' ? 'linear-gradient(90deg, #059669, #10b981)' :
                    'linear-gradient(90deg, #2563eb, #3b82f6)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/70">
                {charging.entryBattery.toFixed(0)}% → {charging.currentBattery.toFixed(0)}%
              </div>
            </div>

            {charging.status === 'ready' && (
              <button onClick={startCharging} className="w-full py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded text-[10px] font-semibold transition-all active:scale-[0.98]">
                Start Charging
              </button>
            )}
            {charging.status === 'blocked' && (
              <button onClick={resolveAllCases} className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded text-[10px] font-semibold transition-all active:scale-[0.98]">
                Resolve All Problems
              </button>
            )}
          </div>

          {/* Cases Panel */}
          <div className="bg-gray-900/90 border border-gray-700/50 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-[10px] font-bold text-gray-300 mb-1.5 border-b border-gray-700/50 pb-1">Diagnostics</div>
            <div className="space-y-1">
              {Object.entries(CASE_META).map(([id, meta]) => {
                const c = cases[id]
                if (!c) return null
                const isActive = c.status === 'active'
                const isResolved = c.status === 'resolved'
                return (
                  <button
                    key={id}
                    onClick={() => setCaseDetailId(id)}
                    className={`w-full text-left px-2 py-1.5 rounded border transition-all ${
                      isActive ? 'border-red-600/50 bg-red-900/20 hover:bg-red-900/30' :
                      isResolved ? 'border-yellow-600/30 bg-yellow-900/10 hover:bg-yellow-900/20' :
                      'border-gray-700/30 bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CaseIcon caseId={meta.icon} className={`w-3 h-3 ${isActive ? 'text-red-400' : isResolved ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <span className={`text-[9px] font-medium truncate ${isActive ? 'text-red-300' : isResolved ? 'text-yellow-300' : 'text-gray-500'}`}>
                        {meta.title}
                      </span>
                      <span className={`ml-auto text-[8px] font-semibold px-1 py-0.5 rounded ${
                        isActive ? 'bg-red-900/40 text-red-400' :
                        isResolved ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-gray-800/50 text-gray-600'
                      }`}>
                        {isActive ? 'ACTIVE' : isResolved ? 'OK' : 'OFF'}
                      </span>
                    </div>
                    {isActive && c.detail && (
                      <div className="text-[8px] text-red-400/70 mt-0.5 truncate">{c.detail}</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {caseDetailId && (
        <CaseDetail caseId={caseDetailId} onClose={() => setCaseDetailId(null)} />
      )}
    </>
  )
}

function SimControls({ isPaused, timeScale, onTogglePause, onSetTimeScale }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onTogglePause}
        className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${isPaused ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
      >
        {isPaused ? '▶ Play' : '⏸ Pause'}
      </button>
      {[1, 5, 20].map(s => (
        <button
          key={s}
          onClick={() => onSetTimeScale(s)}
          className={`px-1.5 py-1 rounded text-[9px] font-semibold transition-all ${timeScale === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
        >
          {s}x
        </button>
      ))}
    </div>
  )
}

export default function WirelessChargingSimPage() {
  const [showLabels, setShowLabels] = useState(true)
  const isPaused = useStore(s => s.isPaused)
  const timeScale = useStore(s => s.timeScale)
  const togglePause = useStore(s => s.togglePause)
  const setTimeScale = useStore(s => s.setTimeScale)
  const setPage = useStore(s => s.setPage)
  const computeChargingDetail = useStore(s => s.computeChargingDetail)

  const binding = useChargingSimBinding()

  useEffect(() => {
    const id = setInterval(() => computeChargingDetail(), 100)
    return () => clearInterval(id)
  }, [computeChargingDetail])

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050510] text-gray-100 z-50">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/95 border-b border-gray-700/50 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => setPage('dashboard')} className="px-2.5 py-1 rounded bg-gray-700 hover:bg-gray-600 text-[10px] font-semibold transition-all">
            ← Dashboard
          </button>
          <h1 className="text-xs font-bold text-gray-200">3D Wireless Charging Simulation</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="rounded w-3 h-3" />
            Labels
          </label>
          <SimControls isPaused={isPaused} timeScale={timeScale} onTogglePause={togglePause} onSetTimeScale={setTimeScale} />
        </div>
      </div>

      <div className="relative flex-1">
        <ChargingScene showLabels={showLabels} />
        <LeftPanel binding={binding} />
        <DataHUD binding={binding} />
        <AlignmentControl />
      </div>
    </div>
  )
}
