import { useState } from 'react'
import useStore from '../store/simulationStore'
import CaseDetail from './CaseDetail'
import { CaseIcon } from '../utils/icons'

const CASE_META = {
  normal: {
    title: 'Normal Self-Diagnosis',
    icon: 'normal',
    color: 'green',
    desc: 'General system parameter validation',
  },
  fod: {
    title: 'Foreign Object Detection',
    icon: 'fod',
    color: 'red',
    desc: 'Resonance & metal loss analysis',
  },
  capacitor: {
    title: 'Capacitor / Compensation',
    icon: 'capacitor',
    color: 'yellow',
    desc: 'Compensation network monitoring',
  },
  misalignment: {
    title: 'Misalignment',
    icon: 'misalignment',
    color: 'red',
    desc: 'Coil alignment & coupling check',
  },
  inverter: {
    title: 'Inverter Fault',
    icon: 'inverter',
    color: 'red',
    desc: 'IGBT/MOSFET diagnostics',
  },
  aging: {
    title: 'Component Aging',
    icon: 'aging',
    color: 'yellow',
    desc: 'Long-term trend analysis',
  },
  electrical: {
    title: 'Electronics / PSU',
    icon: 'electrical',
    color: 'red',
    desc: 'Power supply & sensor check',
  },
  thermal: {
    title: 'Thermal Monitoring',
    icon: 'thermal',
    color: 'yellow',
    desc: 'Multi-point temperature check',
  },
}

const STATUS_STYLES = {
  inactive: 'border-[#1e293b] bg-[#111827] hover:border-[#334155]',
  active: 'border-red-600/60 bg-[#111827] case-active',
  resolved: 'border-yellow-600/60 bg-[#111827]',
}

const BADGE_STYLES = {
  inactive: 'bg-gray-800/50 text-gray-500 border border-gray-700/30',
  active: 'bg-red-900/30 text-red-400 border border-red-700/30',
  resolved: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30',
}

const COLORS = {
  green: { icon: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
  red: { icon: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
  yellow: { icon: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/5' },
}

export default function CaseCard({ caseId }) {
  const [expanded, setExpanded] = useState(false)
  const caseData = useStore(s => s.cases[caseId])
  const meta = CASE_META[caseId]

  if (!caseData || !meta) return null

  const badgeText = caseData.status === 'inactive' ? 'Inactive' : caseData.status === 'active' ? 'Active' : 'Resolved'
  const color = COLORS[meta.color] || COLORS.green

  return (
    <>
      <div
        onClick={() => setExpanded(!expanded)}
        className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 ${STATUS_STYLES[caseData.status] || STATUS_STYLES.inactive} ${
          caseData.status === 'active' ? 'shadow-lg shadow-red-900/10' : 'shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between mb-2.5">
          <div className={`p-1.5 rounded-lg ${color.bg} ${color.border} border`}>
            <CaseIcon caseId={meta.icon} className={`w-4 h-4 ${color.icon}`} />
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${BADGE_STYLES[caseData.status] || BADGE_STYLES.inactive}`}>
            {badgeText}
          </span>
        </div>
        <h3 className="font-semibold text-sm text-white leading-tight mb-1 tracking-tight">{meta.title}</h3>
        <p className="text-[11px] text-gray-500 mb-2 font-light">{meta.desc}</p>
        {caseData.status === 'active' && (
          <div className="text-[11px] text-red-400/90 line-clamp-2 border-t border-red-900/30 pt-2 mt-1">{caseData.detail}</div>
        )}
        {caseData.status === 'resolved' && (
          <div className="text-[11px] text-yellow-400/90 border-t border-yellow-900/30 pt-2 mt-1 font-medium">Resolved</div>
        )}
        <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          {caseData.steps.length > 0 ? `${caseData.steps.length} steps` : 'No steps'}
        </div>
      </div>
      {expanded && <CaseDetail caseId={caseId} onClose={() => setExpanded(false)} />}
    </>
  )
}

export { CASE_META }
