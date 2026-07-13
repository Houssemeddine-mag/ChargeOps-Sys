import useStore from '../store/simulationStore'
import { BatteryIcon } from '../utils/icons'

export default function ChargingBar() {
  const charging = useStore(s => s.charging)
  const currentVehicle = useStore(s => s.currentVehicle)
  const startCharging = useStore(s => s.startCharging)
  const cases = useStore(s => s.cases)

  if (!currentVehicle) return null

  const entryPct = charging.entryBattery
  const currentPct = charging.currentBattery
  const progress = currentPct - entryPct
  const total = 100 - entryPct
  const barPct = total > 0 ? (progress / total) * 100 : 0

  const activeBlockers = Object.values(cases).filter(c => c.blocksCharging && c.status === 'active')

  let statusText = ''
  let statusColor = 'text-gray-400'
  switch (charging.status) {
    case 'idle':
      statusText = 'No vehicle'
      break
    case 'ready':
      statusText = 'Ready to charge'
      statusColor = 'text-blue-400'
      break
    case 'charging':
      statusText = `Charging${charging.speed < 0.5 ? ' (degraded)' : ''}`
      statusColor = 'text-green-400'
      break
    case 'blocked':
      statusText = `Blocked: ${activeBlockers.map(b => blockName(b.caseId)).join(', ')}`
      statusColor = 'text-red-400'
      break
    case 'complete':
      statusText = 'Charging complete'
      statusColor = 'text-green-400'
      break
  }

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${
            charging.status === 'charging' ? 'bg-emerald-500/10 border border-emerald-500/20' :
            charging.status === 'complete' ? 'bg-emerald-500/10 border border-emerald-500/20' :
            charging.status === 'blocked' ? 'bg-red-500/10 border border-red-500/20' :
            'bg-blue-500/10 border border-blue-500/20'
          }`}>
            <BatteryIcon className={`w-4 h-4 ${
              charging.status === 'charging' ? 'text-emerald-400' :
              charging.status === 'complete' ? 'text-emerald-400' :
              charging.status === 'blocked' ? 'text-red-400' :
              'text-blue-400'
            }`} />
          </div>
          <div>
            <span className="font-semibold text-sm text-white">Charging Progress</span>
            <span className={`text-xs font-medium ml-2 ${statusColor}`}>{statusText}</span>
          </div>
        </div>
        <span className="text-sm text-gray-300 font-mono tabular-nums">{currentPct.toFixed(0)}%</span>
      </div>

      <div className="relative h-6 bg-[#0d1117] rounded-full overflow-hidden border border-[#1e293b]/50">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
            charging.status === 'charging' ? 'animate-shimmer' : ''
          }`}
          style={{
            width: `${barPct}%`,
            background: charging.status === 'blocked'
              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
              : charging.status === 'complete'
                ? 'linear-gradient(90deg, #059669, #10b981)'
                : 'linear-gradient(90deg, #2563eb, #3b82f6)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white/70 font-medium tabular-nums">
          {entryPct.toFixed(0)}% &rarr; {currentPct.toFixed(0)}%
        </div>
      </div>

      {charging.status === 'ready' && (
        <button
          onClick={startCharging}
          className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          Start Charging
        </button>
      )}
    </div>
  )
}

function blockName(id) {
  const names = {
    misalignment: 'Misalignment',
    fod: 'FOD',
    inverter: 'Inverter Fault',
    capacitor: 'Capacitor Fault',
    electrical: 'Electrical Fault',
    thermal: 'Overheating',
  }
  return names[id] || id
}
