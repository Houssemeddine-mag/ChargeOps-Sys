import useStore from '../store/simulationStore'
import { CASE_META } from './CaseCard'
import { CheckIcon, CrossIcon, PlayIcon, CircleIcon, WarningIcon, CaseIcon } from '../utils/icons'
import { LightningIcon } from '../utils/icons'

function StepIcon({ status }) {
  switch (status) {
    case 'pass':
    case 'complete':
    case 'available':
      return <CheckIcon className="w-3.5 h-3.5" />
    case 'fail':
    case 'unavailable':
      return <CrossIcon className="w-3.5 h-3.5" />
    case 'active':
      return <PlayIcon className="w-3 h-3" />
    case 'emergency':
      return <WarningIcon className="w-3.5 h-3.5" />
    case 'required':
    case 'warn':
      return <span className="text-xs font-bold">!</span>
    default:
      return <CircleIcon className="w-3.5 h-3.5" />
  }
}

const STEP_COLORS = {
  pass: 'border-green-700/50 bg-green-900/20 text-green-400',
  fail: 'border-red-700/50 bg-red-900/20 text-red-400',
  complete: 'border-blue-700/50 bg-blue-900/20 text-blue-400',
  pending: 'border-gray-700/50 bg-gray-900/20 text-gray-500',
  skipped: 'border-gray-700/30 bg-gray-900/10 text-gray-600',
}

export default function CaseDetail({ caseId, onClose }) {
  const caseData = useStore(s => s.cases[caseId])
  const advanceCaseStep = useStore(s => s.advanceCaseStep)
  const resetCase = useStore(s => s.resetCase)
  const resolveCase = useStore(s => s.resolveCase)
  const meta = CASE_META[caseId]

  if (!caseData || !meta) return null

  const isLastStep = caseData.currentStep >= caseData.steps.length - 1

  const ICON_COLORS = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  }

  const STATUS_BG = {
    active: 'border-red-800/40 bg-red-900/20 text-red-400',
    resolved: 'border-yellow-800/40 bg-yellow-900/20 text-yellow-400',
    inactive: 'border-emerald-800/40 bg-emerald-900/20 text-emerald-400',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] mx-4 bg-[#0d1117] border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/60 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${ICON_COLORS[meta.color] || ICON_COLORS.green}`}>
              <CaseIcon caseId={meta.icon} className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{meta.title}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{meta.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl cursor-pointer p-1 leading-none">&times;</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className={`text-xs p-3 rounded-xl border font-medium leading-relaxed ${STATUS_BG[caseData.status] || STATUS_BG.inactive}`}>
            {caseData.detail}
          </div>

          <div className="space-y-1.5">
            {caseData.steps.map((step, idx) => {
              const isCurrent = idx === caseData.currentStep && caseData.status === 'active'
              const done = idx < caseData.currentStep || caseData.status === 'resolved'
              const color = isCurrent
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                : done
                  ? (STEP_COLORS[step.status] || STEP_COLORS.pending)
                  : STEP_COLORS.pending

              return (
                <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${color}`}>
                  <span className="w-5 shrink-0 flex items-center justify-center">
                    {isCurrent ? <PlayIcon className="w-3 h-3" /> : <StepIcon status={step.status} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{step.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{step.detail}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-900/30 border border-yellow-700/30 shrink-0">CURRENT</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {caseData.status === 'active' && (
          <div className="px-5 py-4 border-t border-gray-800/80 space-y-2">
            {caseId === 'fod' && (
              <button
                onClick={() => resolveCase(caseId)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LightningIcon className="w-4 h-4" />
                Remove Foreign Object
              </button>
            )}
            <button
              onClick={() => advanceCaseStep(caseId)}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              {isLastStep ? 'Complete Diagnostic' : 'Next Step'}
            </button>
          </div>
        )}

        {caseData.status === 'resolved' && (
          <div className="px-5 py-4 border-t border-gray-800/80">
            <button
              onClick={() => resetCase(caseId)}
              className="w-full py-2.5 bg-gray-700/80 hover:bg-gray-600/80 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              Re-run Diagnostic
            </button>
          </div>
        )}

        {caseData.status === 'inactive' && (
          <div className="px-5 py-4 border-t border-gray-800/80">
            <button onClick={onClose} className="w-full py-2.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
