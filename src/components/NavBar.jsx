import useStore, { SYSTEM_COMPONENTS } from '../store/simulationStore'
import { MenuIcon, LightningIcon, CheckIcon, CrossIcon } from '../utils/icons'

const LABELS = {
  powerSupply: 'Power Supply',
  controller: 'Controller',
  sensors: 'Sensors',
  communication: 'Communication',
}

export default function NavBar({ onToggleSidebar }) {
  const systemStates = useStore(s => s.systemStates)
  const toggleSystemState = useStore(s => s.toggleSystemState)
  const generateNewVehicle = useStore(s => s.generateNewVehicle)

  return (
    <header className="bg-[#0d1117]/95 backdrop-blur-sm border-b border-[#1e293b] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="text-gray-400 hover:text-white cursor-pointer px-1.5 py-1 rounded-lg hover:bg-white/5 transition-all" title="Simulation Controls">
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <LightningIcon className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">ChargeOps</span>
          <span className="text-[10px] font-medium text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full border border-gray-700/50">v1.0</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {SYSTEM_COMPONENTS.map(key => {
          const isOK = systemStates[key] === 'OK'
          return (
            <button
              key={key}
              onClick={() => toggleSystemState(key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isOK
                  ? 'bg-emerald-900/25 border-emerald-700/50 text-emerald-400 hover:bg-emerald-800/40 hover:border-emerald-600/50'
                  : 'bg-red-900/25 border-red-700/50 text-red-400 hover:bg-red-800/40 hover:border-red-600/50'
              }`}
              title={`Click to toggle ${LABELS[key]}`}
            >
              {isOK ? <CheckIcon className="w-3 h-3" /> : <CrossIcon className="w-3 h-3" />}
              <span className="hidden sm:inline">{LABELS[key]}:</span> {systemStates[key]}
            </button>
          )
        })}
        <div className="w-px h-6 bg-gray-800 mx-1 hidden sm:block" />
        <button
          onClick={generateNewVehicle}
          disabled={systemStates.powerSupply === 'ER'}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
            systemStates.powerSupply === 'ER'
              ? 'border-gray-700/50 bg-gray-800/30 text-gray-600 cursor-not-allowed'
              : 'border-blue-700/50 bg-blue-900/25 text-blue-400 hover:bg-blue-800/40 hover:border-blue-600/50 active:scale-[0.97]'
          }`}
        >
          + New
        </button>
      </div>
    </header>
  )
}
