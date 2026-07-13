import useStore from '../store/simulationStore'
import { CarIcon } from '../utils/icons'

const PARAM_KEYS = [
  { key: 'voltage', decimals: 1 },
  { key: 'current', decimals: 1 },
  { key: 'temperature', decimals: 1 },
  { key: 'frequency', decimals: 2 },
  { key: 'couplingK', decimals: 3 },
  { key: 'airGap', decimals: 1 },
  { key: 'lateralDistance', decimals: 1 },
  { key: 'angle', decimals: 1 },
  { key: 'communicationQuality', decimals: 1 },
]

const PARAM_LABELS = {
  voltage: 'Voltage (V)',
  current: 'Current (A)',
  temperature: 'Temp (\u00b0C)',
  frequency: 'Freq (kHz)',
  couplingK: 'Coupling k',
  airGap: 'Air Gap (cm)',
  lateralDistance: 'Lateral (cm)',
  angle: 'Angle (\u00b0)',
  communicationQuality: 'Comm (%)',
}

export default function VehicleDashboard() {
  const vehicle = useStore(s => s.currentVehicle)
  const cases = useStore(s => s.cases)
  const generateNewVehicle = useStore(s => s.generateNewVehicle)
  const resolveAllCases = useStore(s => s.resolveAllCases)

  if (!vehicle) return null

  const activeCases = Object.values(cases).filter(c => c.status === 'active')
  const resolvedCases = Object.values(cases).filter(c => c.status === 'resolved')

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1e293b] p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <CarIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base tracking-tight">{vehicle.id}</h2>
              <span className="text-[10px] font-medium text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700/50">ACTIVE</span>
            </div>
            <p className="text-[11px] text-gray-500">{new Date(vehicle.generatedAt).toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={generateNewVehicle}
          className="px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-all border border-gray-700/50 cursor-pointer hover:border-gray-600/50 active:scale-[0.97]"
        >
          New Vehicle
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 mb-4">
        {PARAM_KEYS.map(({ key, decimals }) => (
          <div key={key} className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#1e293b]/50 hover:border-[#334155]/50 transition-colors">
            <div className="text-base font-bold text-white tabular-nums tracking-tight">
              {vehicle.params[key].toFixed(decimals)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{PARAM_LABELS[key]}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap text-sm">
        <span className="text-[11px] text-gray-500 font-medium mr-1">Conditions:</span>
        {activeCases.length === 0 && resolvedCases.length === 0 && (
          <span className="text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-700/30">
            All OK
          </span>
        )}
        {activeCases.map(c => (
          <span key={c.caseId} className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-red-700/30 animate-pulse">
            {caseDisplayName(c.caseId)}
          </span>
        ))}
        {resolvedCases.map(c => (
          <span key={c.caseId} className="text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-yellow-700/30">
            {caseDisplayName(c.caseId)}
          </span>
        ))}
      </div>
      {activeCases.length > 0 && (
        <button
          onClick={resolveAllCases}
          className="mt-3 w-full py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-red-900/20 active:scale-[0.98]"
        >
          Resolve All Problems ({activeCases.length})
        </button>
      )}
    </div>
  )
}

function caseDisplayName(id) {
  const names = {
    normal: 'Normal',
    fod: 'FOD',
    capacitor: 'Capacitor',
    misalignment: 'Misalignment',
    inverter: 'Inverter',
    aging: 'Aging',
    electrical: 'Electrical',
    thermal: 'Thermal',
  }
  return names[id] || id
}
