import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import useStore from './store/simulationStore'
import NavBar from './components/NavBar'
import VehicleDashboard from './components/VehicleDashboard'
import ChargingBar from './components/ChargingBar'
import CaseCard from './components/CaseCard'
import ReportModal from './components/ReportModal'
import SimulationSidebar from './components/SimulationSidebar'
import { LightningIcon } from './utils/icons'

const WirelessChargingSimPage = lazy(() => import('./pages/WirelessChargingSimPage'))

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentVehicle = useStore(s => s.currentVehicle)
  const systemStates = useStore(s => s.systemStates)
  const charging = useStore(s => s.charging)
  const simulationComplete = useStore(s => s.simulationComplete)
  const simulateCycle = useStore(s => s.simulateCycle)
  const reportGenerated = useStore(s => s.reportGenerated)
  const currentPage = useStore(s => s.currentPage)
  const isPaused = useStore(s => s.isPaused)
  const timeScale = useStore(s => s.timeScale)
  const computeChargingDetail = useStore(s => s.computeChargingDetail)
  const intervalRef = useRef(null)
  const powerOff = systemStates.powerSupply === 'ER'

  useEffect(() => {
    if (charging.status === 'charging' && !simulationComplete && !isPaused) {
      const interval = Math.max(50, 800 / timeScale)
      intervalRef.current = setInterval(() => {
        simulateCycle()
      }, interval)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [charging.status, simulationComplete, simulateCycle, isPaused, timeScale])

  if (currentPage === '3d') {
    return (
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-[#050510] text-gray-100 z-50">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading 3D Scene...</p>
          </div>
        </div>
      }>
        <WirelessChargingSimPage />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen flex flex-col text-gray-100" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f172a 0%, #080c16 100%)' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <NavBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <SimulationSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="relative flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {powerOff ? (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-900/40 border-2 border-red-600 flex items-center justify-center shadow-lg shadow-red-900/30">
              <span className="text-4xl font-bold text-red-500">X</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">System Offline</h1>
            <p className="text-red-400/80 text-lg text-center max-w-md font-light">
              Power supply failure detected. The entire system is inactive.
            </p>
            <p className="text-gray-500 text-sm text-center max-w-md">
              Toggle Power Supply back to OK to restore system functionality.
            </p>
          </div>
        ) : !currentVehicle ? (
          <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
            <div className="p-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
              <LightningIcon className="w-12 h-12 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">ChargeOps Sys</h1>
            <p className="text-gray-400 text-lg text-center max-w-md font-light">
              Wireless EV Charging Diagnostic Simulation System
            </p>
            <button
              onClick={() => useStore.getState().generateNewVehicle()}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg font-semibold text-white transition-all duration-200 text-lg shadow-lg shadow-red-900/30 hover:shadow-red-800/40 active:scale-[0.98]"
            >
              Start New Simulation
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end">
              <button
                onClick={() => useStore.getState().setPage('3d')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg font-semibold text-white text-xs transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] whitespace-nowrap mb-2"
              >
                ⚡ Open 3D Charging View
              </button>
            </div>
            <VehicleDashboard />
            <ChargingBar />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['normal', 'fod', 'capacitor', 'misalignment', 'inverter', 'aging', 'electrical', 'thermal'].map(id => (
                <CaseCard key={id} caseId={id} />
              ))}
            </div>
          </>
        )}
      </main>
      {simulationComplete && !reportGenerated && <ReportModal />}
    </div>
  )
}
