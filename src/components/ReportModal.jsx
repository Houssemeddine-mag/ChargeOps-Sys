import useStore from '../store/simulationStore'
import { generateReportPDF } from '../utils/pdfGenerator'
import { GiftIcon } from '../utils/icons'

export default function ReportModal() {
  const vehicle = useStore(s => s.currentVehicle)
  const cases = useStore(s => s.cases)
  const chargingHistory = useStore(s => s.chargingHistory)
  const systemStates = useStore(s => s.systemStates)
  const setReportGenerated = useStore(s => s.setReportGenerated)
  const resetSimulation = useStore(s => s.resetSimulation)
  const generateNewVehicle = useStore(s => s.generateNewVehicle)

  if (!vehicle) return null

  const caseResults = Object.values(cases).map(c => ({
    caseId: c.caseId,
    status: c.status,
    detail: c.detail,
  }))

  const handleDownload = () => {
    try {
      const pdfData = generateReportPDF(vehicle, caseResults, chargingHistory, systemStates)
      const blob = new Blob([pdfData], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ChargeOps_Report_${vehicle.id}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setReportGenerated(true)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Could not generate PDF. See console for details.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative bg-[#0d1117] border border-gray-700/50 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl shadow-black/60">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <GiftIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Simulation Complete</h2>
            <p className="text-sm text-gray-400 font-light mt-1">
              Vehicle {vehicle.id} has completed charging
            </p>
          </div>
        </div>

        <div className="bg-[#0d1117] rounded-lg border border-[#1e293b]/50 divide-y divide-[#1e293b]/50">
          {[
            { label: 'Entry Battery', value: `${vehicle.params.entryBattery}%`, color: 'text-white' },
            { label: 'Final Battery', value: '100%', color: 'text-emerald-400' },
            { label: 'Issues Found', value: caseResults.filter(c => c.status === 'active' || c.status === 'resolved').length.toString(), color: 'text-white' },
            { label: 'Issues Resolved', value: caseResults.filter(c => c.status === 'resolved').length.toString(), color: 'text-yellow-400' },
            { label: 'Cycles Simulated', value: chargingHistory.length.toString(), color: 'text-white' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between px-3.5 py-2.5 text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className={`font-mono tabular-nums font-medium ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-red-900/20 active:scale-[0.98]"
          >
            Download PDF Report
          </button>
          <button
            onClick={generateNewVehicle}
            className="flex-1 py-2.5 bg-gray-700/80 hover:bg-gray-600/80 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]"
          >
            New Simulation
          </button>
        </div>
        <button
          onClick={() => { setReportGenerated(true); resetSimulation() }}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer active:scale-[0.98]"
        >
          Close
        </button>
      </div>
    </div>
  )
}
