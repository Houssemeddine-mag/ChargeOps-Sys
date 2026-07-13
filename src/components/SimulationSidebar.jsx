import { useState } from 'react'
import useStore, { ALL_CASES } from '../store/simulationStore'
import { ChevronRightIcon, ChevronDownIcon } from '../utils/icons'
import CaseDetail from './CaseDetail'

const CASE_NAMES = {
  normal: 'Normal Self-Diagnosis',
  fod: 'Foreign Object Detection',
  capacitor: 'Capacitor / Compensation',
  misalignment: 'Misalignment',
  inverter: 'Inverter Fault',
  aging: 'Component Aging',
  electrical: 'Electronics / PSU',
  thermal: 'Thermal Monitoring',
}

const PARAMS = [
  { key: 'voltage', label: 'Voltage', min: 350, max: 450, step: 1, unit: 'V' },
  { key: 'current', label: 'Current', min: 5, max: 35, step: 0.5, unit: 'A' },
  { key: 'temperature', label: 'Temperature', min: 20, max: 110, step: 1, unit: '\u00b0C' },
  { key: 'frequency', label: 'Frequency', min: 70, max: 95, step: 0.5, unit: 'kHz' },
  { key: 'communicationQuality', label: 'Comm Quality', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'couplingK', label: 'Coupling (k)', min: 0.50, max: 0.99, step: 0.01, unit: '' },
  { key: 'airGap', label: 'Air Gap', min: 5, max: 50, step: 0.5, unit: 'cm' },
  { key: 'lateralDistance', label: 'Lateral Dist.', min: 0, max: 25, step: 0.5, unit: 'cm' },
  { key: 'angle', label: 'Angle', min: 0, max: 15, step: 0.5, unit: '\u00b0' },
  { key: 'metalLoss', label: 'Metal Loss', min: 0, max: 150, step: 1, unit: 'W' },
  { key: 'resonanceAmplitude', label: 'Resonance Amp.', min: 50, max: 140, step: 1, unit: '%' },
  { key: 'cap1Drift', label: 'Capacitor Drift', min: -30, max: 30, step: 1, unit: '%' },
  { key: 'compensationLosses', label: 'Comp. Losses', min: 0, max: 180, step: 1, unit: 'W' },
  { key: 'igbtTemperature', label: 'IGBT Temp', min: 25, max: 100, step: 1, unit: '\u00b0C' },
  { key: 'powerLosses', label: 'Power Losses', min: 0, max: 15, step: 0.5, unit: '%' },
  { key: 'switchingNoise', label: 'Switching Noise', min: 20, max: 55, step: 1, unit: 'dB' },
  { key: 'inductanceDrift', label: 'Inductance Drift', min: 0, max: 15, step: 0.5, unit: '%' },
  { key: 'voltageDrift', label: 'Voltage Drift', min: 0, max: 15, step: 0.5, unit: '%' },
  { key: 'transformerTemp', label: 'Transformer Temp', min: 20, max: 65, step: 1, unit: '\u00b0C' },
  { key: 'inverterTemp', label: 'Inverter Temp', min: 20, max: 65, step: 1, unit: '\u00b0C' },
  { key: 'capacitorTemp', label: 'Capacitor Temp', min: 20, max: 65, step: 1, unit: '\u00b0C' },
  { key: 'rectifierTemp', label: 'Rectifier Temp', min: 20, max: 65, step: 1, unit: '\u00b0C' },
  { key: 'microCoolerTemp', label: 'Micro Cooler', min: 15, max: 55, step: 1, unit: '\u00b0C' },
  { key: 'entryBattery', label: 'Entry Battery', min: 5, max: 60, step: 1, unit: '%' },
]

const SECTIONS = [
  { title: 'Electrical', keys: ['voltage', 'current', 'temperature', 'frequency', 'communicationQuality'] },
  { title: 'Alignment', keys: ['couplingK', 'airGap', 'lateralDistance', 'angle'] },
  { title: 'FOD', keys: ['metalLoss', 'resonanceAmplitude'] },
  { title: 'Capacitor', keys: ['cap1Drift', 'compensationLosses'] },
  { title: 'Inverter', keys: ['igbtTemperature'] },
  { title: 'Aging', keys: ['powerLosses', 'switchingNoise', 'inductanceDrift', 'voltageDrift'] },
  { title: 'Thermal', keys: ['transformerTemp', 'inverterTemp', 'capacitorTemp', 'rectifierTemp', 'microCoolerTemp'] },
  { title: 'Battery', keys: ['entryBattery'] },
]

export default function SimulationSidebar({ open, onClose }) {
  const currentVehicle = useStore(s => s.currentVehicle)
  const cases = useStore(s => s.cases)
  const updateVehicleParam = useStore(s => s.updateVehicleParam)
  const toggleCaseOnOff = useStore(s => s.toggleCaseOnOff)
  const generateNewVehicle = useStore(s => s.generateNewVehicle)
  const setNormalState = useStore(s => s.setNormalState)
  const [expandedSections, setExpandedSections] = useState(SECTIONS.map(s => s.title))
  const [diagnoseCase, setDiagnoseCase] = useState(null)

  if (!currentVehicle) return null

  const toggleSection = (title) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const paramMap = {}
  PARAMS.forEach(p => { paramMap[p.key] = p })

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full bg-[#0d1117] border-r border-[#1e293b] w-80 transition-transform duration-300 overflow-y-auto shadow-2xl shadow-black/50 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur-sm border-b border-[#1e293b] p-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-white text-sm tracking-tight">Simulation Controls</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/5 transition-all">&times;</button>
        </div>

        <div className="p-3 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={generateNewVehicle}
              className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              Randomize All
            </button>
            <button
              onClick={setNormalState}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
            >
              Normal State
            </button>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-gray-700" />
              Problems
            </h3>
            <div className="space-y-1">
              {ALL_CASES.map(id => {
                const c = cases[id]
                const active = c?.status === 'active'
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (cases[id]?.status === 'inactive') toggleCaseOnOff(id)
                      setDiagnoseCase(id)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-red-900/20 border-red-700/50 text-red-400 shadow-sm shadow-red-900/20'
                        : 'bg-[#111827] border-[#1e293b] text-gray-400 hover:border-[#334155] hover:bg-[#1a2332]'
                    }`}
                  >
                    <span className="font-medium">{CASE_NAMES[id]}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      active ? 'bg-red-900/40 text-red-400' : 'bg-gray-800/50 text-gray-600'
                    }`}>
                      {c.status === 'active' ? 'ACTIVE' : c.status === 'resolved' ? 'RESOLVED' : 'INACTIVE'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-gray-700" />
              Parameters
            </h3>
            <div className="space-y-1">
              {SECTIONS.map(section => {
                const expanded = expandedSections.includes(section.title)
                return (
                  <div key={section.title} className="border border-[#1e293b] rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#111827] text-xs font-medium text-gray-300 cursor-pointer hover:bg-[#1a2332] transition-colors"
                    >
                      <span>{section.title}</span>
                      <span className="text-gray-600">{expanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}</span>
                    </button>
                    {expanded && (
                      <div className="p-2 space-y-2 border-t border-[#1e293b]/50 bg-[#0d1117]">
                        {section.keys.map(key => {
                          const p = paramMap[key]
                          if (!p) return null
                          const val = currentVehicle.params[key]
                          const pct = ((val - p.min) / (p.max - p.min)) * 100
                          const isBad = (key === 'voltage' && (val < 380 || val > 420)) ||
                            (key === 'temperature' && val > 60) ||
                            (key === 'communicationQuality' && val < 85)
                          return (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-400">{p.label}</span>
                                <span className={`font-mono tabular-nums ${isBad ? 'text-red-400' : 'text-white'}`}>{typeof val === 'number' ? val.toFixed(p.step < 1 ? 2 : 0) : val}{p.unit}</span>
                              </div>
                              <input
                                type="range"
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={val}
                                onChange={e => updateVehicleParam(key, parseFloat(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-700 accent-red-600"
                                style={{
                                  background: `linear-gradient(to right, ${isBad ? '#dc2626' : '#3b82f6'} 0%, ${isBad ? '#dc2626' : '#3b82f6'} ${pct}%, #374151 ${pct}%, #374151 100%)`,
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {diagnoseCase && <CaseDetail caseId={diagnoseCase} onClose={() => setDiagnoseCase(null)} />}
    </>
  )
}
