import { create } from 'zustand'
import { generateVehicle } from '../utils/vehicleGenerator'
import { evaluateCase, CASE_IDS } from '../data/diagnosticLogic'

function createInitialCaseState(caseId) {
  return {
    caseId,
    status: 'inactive',
    severity: 'ok',
    detail: 'Waiting for vehicle',
    steps: [],
    currentStep: 0,
    blocksCharging: false,
  }
}

const SYSTEM_COMPONENTS = ['powerSupply', 'controller', 'sensors', 'communication']
const ALL_CASES = Object.values(CASE_IDS)

const SYSTEM_OVERRIDES = {
  communication: {
    keys: ['communicationQuality', 'switchingNoise'],
    applyBad(p) {
      p.communicationQuality = pick(5, 30)
      p.switchingNoise = pick(35, 45)
    },
  },
  sensors: {
    keys: ['temperature', 'angle', 'airGap', 'lateralDistance', 'couplingK', 'transformerTemp', 'inverterTemp', 'capacitorTemp', 'rectifierTemp', 'microCoolerTemp'],
    applyBad(p) {
      p.temperature = pick(70, 110)
      p.angle = pick(5, 15)
      p.airGap = pick(25, 45)
      p.lateralDistance = pick(8, 20)
      p.couplingK = pick(0.5, 0.75)
      p.transformerTemp = pick(40, 58)
      p.inverterTemp = pick(40, 58)
      p.capacitorTemp = pick(40, 58)
      p.rectifierTemp = pick(40, 58)
      p.microCoolerTemp = pick(35, 48)
    },
  },
  controller: {
    keys: ['voltage', 'current', 'frequency', 'igbtTemperature'],
    applyBad(p) {
      p.voltage = Math.random() > 0.5 ? pick(300, 360) : pick(430, 450)
      p.current = Math.random() > 0.5 ? pick(8, 15) : pick(28, 35)
      p.frequency = Math.random() > 0.5 ? pick(70, 80) : pick(90, 95)
      p.igbtTemperature = pick(75, 95)
    },
  },
}

const useStore = create((set, get) => ({
  systemStates: {
    powerSupply: 'OK',
    controller: 'OK',
    sensors: 'OK',
    communication: 'OK',
  },

  currentVehicle: null,

  cases: ALL_CASES.reduce((acc, id) => {
    acc[id] = createInitialCaseState(id)
    return acc
  }, {}),

  charging: {
    status: 'idle',
    entryBattery: 0,
    currentBattery: 0,
    speed: 0,
  },

  chargingHistory: [],
  simulationComplete: false,
  reportGenerated: false,
  systemBackup: {},

  currentPage: 'dashboard',
  isPaused: false,
  timeScale: 1,

  chargingSimDetail: {
    gridVoltage: 0, gridCurrent: 0,
    dcBusVoltage: 0, dcBusCurrent: 0,
    hfVoltage: 0, hfCurrent: 0, hfFrequency: 85000,
    txPower: 0, rxPower: 0,
    rxVoltage: 0, rxCurrent: 0,
    rectDcVoltage: 0, rectDcCurrent: 0,
    dcdcVoltage: 0, dcdcCurrent: 0,
    batteryVoltage: 0, batteryCurrent: 0,
    efficiency: 0,
    stageEfficiencies: {
      acDc: 0, hfInverter: 0, coupling: 0,
      hfRectifier: 0, dcdc: 0, overall: 0,
    },
    waveforms: { grid: [], hf: [], rx: [], dcdc: [] },
  },

  toggleSystemState(component) {
    if (!SYSTEM_COMPONENTS.includes(component)) return
    set(state => {
      const newVal = state.systemStates[component] === 'OK' ? 'ER' : 'OK'
      const newSystemStates = { ...state.systemStates, [component]: newVal }

      if (component === 'powerSupply' && newVal === 'ER') {
        return {
          systemStates: newSystemStates,
          currentVehicle: null,
          cases: ALL_CASES.reduce((acc, id) => { acc[id] = createInitialCaseState(id); return acc }, {}),
          charging: { status: 'idle', entryBattery: 0, currentBattery: 0, speed: 0 },
          chargingHistory: [],
          simulationComplete: false,
          reportGenerated: false,
          systemBackup: {},
        }
      }

      if (!state.currentVehicle) return { systemStates: newSystemStates }

      const params = { ...state.currentVehicle.params }
      const backup = { ...(state.systemBackup || {}) }
      const ov = SYSTEM_OVERRIDES[component]
      if (!ov) return { systemStates: newSystemStates }

      if (newVal === 'ER') {
        ov.keys.forEach(key => {
          if (!(key in backup)) backup[key] = params[key]
        })
        ov.applyBad(params)
      } else {
        ov.keys.forEach(key => {
          if (key in backup) {
            params[key] = backup[key]
            delete backup[key]
          }
        })
      }

      const newVehicle = { ...state.currentVehicle, params }
      const newCases = reevaluateAllCases(newVehicle, newSystemStates)
      const chargingState = recalculateCharging(newCases, state.charging.entryBattery, state.charging.currentBattery)
      setTimeout(() => get().computeChargingDetail(), 10)
      return { systemStates: newSystemStates, currentVehicle: newVehicle, cases: newCases, charging: chargingState, systemBackup: backup }
    })
  },

  generateNewVehicle() {
    const sys = get().systemStates
    if (sys.powerSupply === 'ER') return
    const vehicle = generateVehicle()
    const systemStates = get().systemStates
    const newCases = reevaluateAllCases(vehicle, systemStates)
    const charging = {
      status: newCases.misalignment.blocksCharging || newCases.fod.blocksCharging ? 'blocked' : 'ready',
      entryBattery: vehicle.params.entryBattery,
      currentBattery: vehicle.params.entryBattery,
      speed: calculateSpeed(newCases),
    }
    set({
      currentVehicle: vehicle,
      cases: newCases,
      charging,
      chargingHistory: [{ battery: vehicle.params.entryBattery, status: 'ready', cycle: 0 }],
      simulationComplete: false,
      reportGenerated: false,
      systemBackup: {},
    })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  startCharging() {
    const state = get()
    if (!state.currentVehicle) return
    if (state.charging.status === 'blocked') return
    set(s => ({
      charging: { ...s.charging, status: 'charging' },
    }))
    setTimeout(() => get().computeChargingDetail(), 50)
  },

  simulateCycle() {
    const state = get()
    if (!state.currentVehicle || state.charging.status !== 'charging' || state.simulationComplete) return

    const { charging, cases, currentVehicle, systemStates, chargingHistory } = state

    const blockCases = Object.values(cases).filter(c => c.blocksCharging && c.status === 'active')
    const isBlocked = blockCases.length > 0

    if (isBlocked) {
      const newHistory = [...chargingHistory, { battery: charging.currentBattery, status: 'blocked', cycle: chargingHistory.length, blockers: blockCases.map(c => c.caseId) }]
      set({ chargingHistory: newHistory, charging: { ...charging, status: 'blocked' } })
      get().computeChargingDetail()
      return
    }

    const speed = calculateSpeed(cases)
    const gain = speed * 1.5
    const newBattery = Math.min(100, charging.currentBattery + gain)

    const newHistory = [...chargingHistory, { battery: newBattery, status: 'charging', cycle: chargingHistory.length }]

    if (newBattery >= 100) {
      set({
        charging: { ...charging, currentBattery: 100, status: 'complete', speed },
        chargingHistory: newHistory,
        simulationComplete: true,
      })
    } else {
      set({
        charging: { ...charging, currentBattery: newBattery, speed },
        chargingHistory: newHistory,
      })
    }
    get().computeChargingDetail()
  },

  advanceCaseStep(caseId) {
    set(state => {
      const c = state.cases[caseId]
      if (!c || c.status !== 'active') return state
      const maxStep = c.steps.length - 1
      if (c.currentStep >= maxStep) {
        const newSteps = c.steps.map(s => s.status === 'pending' ? { ...s, status: 'pass' } : s)
        const newParams = { ...state.currentVehicle.params }
        setSafeParamsForCase(caseId, newParams)
        const newVehicle = { ...state.currentVehicle, params: newParams }
        const newCases = reevaluateAllCases(newVehicle, state.systemStates)
        const resolvedCase = { ...c, steps: newSteps, status: 'resolved', detail: 'Diagnostic completed' }
        const chargingState = recalculateCharging({ ...newCases, [caseId]: resolvedCase }, state.charging.entryBattery, state.charging.currentBattery)
        return {
          currentVehicle: newVehicle,
          cases: { ...newCases, [caseId]: resolvedCase },
          charging: chargingState,
        }
      }
      const newStepIdx = c.currentStep + 1
      const newSteps = c.steps.map((s, i) => {
        if (i < newStepIdx && s.status === 'pending') return { ...s, status: 'pass' }
        return s
      })
      return {
        cases: {
          ...state.cases,
          [caseId]: { ...c, steps: newSteps, currentStep: newStepIdx },
        },
      }
    })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  resolveCase(caseId) {
    set(state => {
      const c = state.cases[caseId]
      if (!c || c.status !== 'active' || !state.currentVehicle) return state
      const newParams = { ...state.currentVehicle.params }
      setSafeParamsForCase(caseId, newParams)
      const newVehicle = { ...state.currentVehicle, params: newParams }
      const newCases = reevaluateAllCases(newVehicle, state.systemStates)
      const resolvedSteps = c.steps.map(s => ({ ...s, status: s.status === 'pending' ? 'pass' : s.status }))
      const resolved = { ...c, steps: resolvedSteps, currentStep: c.steps.length - 1, status: 'resolved', detail: 'Diagnostic completed', blocksCharging: false }
      const chargingState = recalculateCharging({ ...newCases, [caseId]: resolved }, state.charging.entryBattery, state.charging.currentBattery)
      return { currentVehicle: newVehicle, cases: { ...newCases, [caseId]: resolved }, charging: chargingState }
    })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  resetCase(caseId) {
    set(state => {
      const vehicle = state.currentVehicle
      if (!vehicle) return state
      const systemStates = state.systemStates
      const evaluation = evaluateCase(caseId, vehicle, systemStates)
      return {
        cases: {
          ...state.cases,
          [caseId]: {
            caseId,
            status: evaluation.triggered ? 'active' : 'inactive',
            severity: evaluation.severity,
            detail: evaluation.details,
            steps: evaluation.steps,
            currentStep: 0,
            blocksCharging: evaluation.blocksCharging || false,
          },
        },
      }
    })
  },

  resolveAllCases() {
    const state = get()
    const newCases = {}
    let anyChange = false
    const newParams = { ...state.currentVehicle.params }
    Object.entries(state.cases).forEach(([id, c]) => {
      if (c.status === 'active') {
        anyChange = true
        setSafeParamsForCase(id, newParams)
        const resolvedSteps = c.steps.map(s => ({ ...s, status: s.status === 'pending' ? 'pass' : s.status }))
        newCases[id] = { ...c, steps: resolvedSteps, currentStep: c.steps.length - 1, status: 'resolved', detail: 'Diagnostic completed', blocksCharging: false }
      } else {
        newCases[id] = c
      }
    })
    if (!anyChange) return
    const newVehicle = { ...state.currentVehicle, params: newParams }
    const reevaluated = reevaluateAllCases(newVehicle, state.systemStates)
    Object.keys(newCases).forEach(id => {
      if (newCases[id].status !== 'resolved') {
        newCases[id] = reevaluated[id]
      }
    })
    const chargingState = recalculateCharging(newCases, state.charging.entryBattery, state.charging.currentBattery)
    set({ currentVehicle: newVehicle, cases: newCases, charging: chargingState })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  setNormalState() {
    const state = get()
    if (!state.currentVehicle) return
    const newParams = { ...state.currentVehicle.params }
    setSafeParamsForCase('normal', newParams)
    setSafeParamsForCase('fod', newParams)
    setSafeParamsForCase('capacitor', newParams)
    setSafeParamsForCase('misalignment', newParams)
    setSafeParamsForCase('inverter', newParams)
    setSafeParamsForCase('aging', newParams)
    setSafeParamsForCase('electrical', newParams)
    setSafeParamsForCase('thermal', newParams)
    newParams.voltage = 390 + Math.random() * 20
    const newVehicle = { ...state.currentVehicle, params: newParams }
    const newCases = reevaluateAllCases(newVehicle, state.systemStates)
    const chargingState = recalculateCharging(newCases, state.charging.entryBattery, state.charging.currentBattery)
    set({ currentVehicle: newVehicle, cases: newCases, charging: chargingState })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  updateVehicleParam(key, value) {
    const state = get()
    if (!state.currentVehicle) return
    const newParams = { ...state.currentVehicle.params, [key]: value }
    const newVehicle = { ...state.currentVehicle, params: newParams }
    const newCases = reevaluateAllCases(newVehicle, state.systemStates)
    const chargingState = recalculateCharging(newCases, state.charging.entryBattery, state.charging.currentBattery)
    set({ currentVehicle: newVehicle, cases: newCases, charging: chargingState })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  toggleCaseOnOff(caseId) {
    const state = get()
    if (!state.currentVehicle) return
    const isActive = state.cases[caseId]?.status === 'active'
    const newParams = { ...state.currentVehicle.params }
    if (isActive) {
      setSafeParamsForCase(caseId, newParams)
    } else {
      setProblemParamsForCase(caseId, newParams)
    }
    const newVehicle = { ...state.currentVehicle, params: newParams }
    const newCases = reevaluateAllCases(newVehicle, state.systemStates)
    const chargingState = recalculateCharging(newCases, state.charging.entryBattery, state.charging.currentBattery)
    set({ currentVehicle: newVehicle, cases: newCases, charging: chargingState })
    setTimeout(() => get().computeChargingDetail(), 10)
  },

  setReportGenerated(val) {
    set({ reportGenerated: val })
  },

  resetSimulation() {
    set({
      currentVehicle: null,
      cases: ALL_CASES.reduce((acc, id) => {
        acc[id] = createInitialCaseState(id)
        return acc
      }, {}),
      charging: { status: 'idle', entryBattery: 0, currentBattery: 0, speed: 0 },
      chargingHistory: [],
      simulationComplete: false,
      reportGenerated: false,
      chargingSimDetail: {
        gridVoltage: 0, gridCurrent: 0,
        dcBusVoltage: 0, dcBusCurrent: 0,
        hfVoltage: 0, hfCurrent: 0, hfFrequency: 85000,
        txPower: 0, rxPower: 0,
        rxVoltage: 0, rxCurrent: 0,
        rectDcVoltage: 0, rectDcCurrent: 0,
        dcdcVoltage: 0, dcdcCurrent: 0,
        batteryVoltage: 0, batteryCurrent: 0,
        efficiency: 0,
        stageEfficiencies: { acDc: 0, hfInverter: 0, coupling: 0, hfRectifier: 0, dcdc: 0, overall: 0 },
        waveforms: { grid: [], hf: [], rx: [], dcdc: [] },
      },
    })
  },

  setPage(page) {
    set({ currentPage: page })
  },

  togglePause() {
    set(s => ({ isPaused: !s.isPaused }))
  },

  setTimeScale(scale) {
    set({ timeScale: scale })
  },

  computeChargingDetail() {
    const s = get()
    if (!s.currentVehicle) return
    const p = s.currentVehicle.params
    const k = p.couplingK || 0.85
    const chargingSpeed = s.charging.status === 'charging' ? (s.charging.speed || 0) : 0

    const gridV = p.voltage || 400
    const gridI = p.current || 20
    const gridP = gridV * gridI
    const gridFreq = 50

    const acDcEff = 0.95
    const dcBusV = gridV * Math.SQRT2 * 0.612 * acDcEff
    const dcBusI = gridI * acDcEff
    const dcBusP = dcBusV * dcBusI

    const hfEff = 0.96
    const hfV = dcBusV
    const hfI = dcBusI * hfEff
    const hfF = p.frequency || 85000
    const hfP = hfV * hfI

    const txP = hfP
    const couplingEff = k * 0.92
    const rxP = txP * couplingEff

    const rxV = hfV * k
    const rxI = hfI * k

    const hfRectEff = 0.94
    const rectV = rxV * hfRectEff
    const rectI = rxI * hfRectEff
    const rectP = rectV * rectI

    const dcdcEff = 0.96
    const battV = 350
    const dcdcV = battV
    const dcdcI = (rectP * dcdcEff) / dcdcV
    const dcdcP = dcdcV * dcdcI

    const overallEff = chargingSpeed > 0 ? (dcdcP / Math.max(gridP, 1)) * chargingSpeed : 0

    const maxPts = 100
    const t = Date.now() / 1000
    const gridAmp = gridV * Math.SQRT2
    const hfAmp = hfV
    const rxAmp = rxV
    const dcdcAmp = dcdcV
    const waveLen = maxPts

    const mkWave = (amp, freq, offset) => {
      const pts = []
      for (let i = 0; i < waveLen; i++) {
        const tt = t - (waveLen - i) * 0.002
        pts.push(Math.sin(tt * freq * 0.01 + offset) * amp * 0.4)
      }
      return pts
    }

    const prevWave = s.chargingSimDetail.waveforms
    const newGrid = prevWave.grid.length >= maxPts ? [...prevWave.grid.slice(1), Math.sin(t * 0.3) * gridAmp * 0.4] : [...prevWave.grid, Math.sin(t * 0.3) * gridAmp * 0.4]
    const newHf = prevWave.hf.length >= maxPts ? [...prevWave.hf.slice(1), Math.sin(t * 50) * hfAmp * 0.4] : [...prevWave.hf, Math.sin(t * 50) * hfAmp * 0.4]
    const newRx = prevWave.rx.length >= maxPts ? [...prevWave.rx.slice(1), Math.sin(t * 50) * rxAmp * 0.4 * k] : [...prevWave.rx, Math.sin(t * 50) * rxAmp * 0.4 * k]
    const newDcdc = prevWave.dcdc.length >= maxPts ? [...prevWave.dcdc.slice(1), dcdcAmp * 0.4 + Math.sin(t * 2) * 5] : [...prevWave.dcdc, dcdcAmp * 0.4 + Math.sin(t * 2) * 5]

    set({
      chargingSimDetail: {
        gridVoltage: gridV, gridCurrent: gridI,
        dcBusVoltage: dcBusV, dcBusCurrent: dcBusI,
        hfVoltage: hfV, hfCurrent: hfI, hfFrequency: hfF,
        txPower: txP, rxPower: rxP,
        rxVoltage: rxV, rxCurrent: rxI,
        rectDcVoltage: rectV, rectDcCurrent: rectI,
        dcdcVoltage: dcdcV, dcdcCurrent: dcdcI,
        batteryVoltage: battV, batteryCurrent: dcdcI,
        efficiency: overallEff,
        stageEfficiencies: {
          acDc: acDcEff,
          hfInverter: hfEff,
          coupling: couplingEff,
          hfRectifier: hfRectEff,
          dcdc: dcdcEff,
          overall: overallEff,
        },
        waveforms: { grid: newGrid, hf: newHf, rx: newRx, dcdc: newDcdc },
      },
    })
  },
}))

function reevaluateAllCases(vehicle, systemStates) {
  const newCases = {}
  ALL_CASES.forEach(id => {
    const evaluation = evaluateCase(id, vehicle, systemStates)
    newCases[id] = {
      caseId: id,
      status: evaluation.triggered ? 'active' : 'inactive',
      severity: evaluation.severity,
      detail: evaluation.details,
      steps: evaluation.steps,
      currentStep: 0,
      blocksCharging: evaluation.blocksCharging || false,
    }
  })
  return newCases
}

function calculateSpeed(cases) {
  const activeCases = Object.values(cases).filter(c => c.status === 'active')
  if (activeCases.length === 0) return 1.0
  let speed = 1.0
  activeCases.forEach(c => {
    if (c.caseId === CASE_IDS.CAPACITOR) speed *= 0.7
    if (c.caseId === CASE_IDS.AGING) speed *= 0.8
    if (c.caseId === CASE_IDS.THERMAL) speed *= 0.5
    if (c.caseId === CASE_IDS.ELECTRICAL) speed *= 0.6
    if (c.caseId === CASE_IDS.INVERTER) speed *= 0.3
    if (c.caseId === CASE_IDS.NORMAL && c.severity !== 'ok') speed *= 0.9
  })
  return Math.max(0, Math.min(1, speed))
}

function recalculateCharging(cases, entryBattery, currentBattery) {
  const blocks = Object.values(cases).filter(c => c.blocksCharging && c.status === 'active')
  if (blocks.length > 0) {
    return { status: 'blocked', entryBattery, currentBattery, speed: 0 }
  }
  return { status: 'ready', entryBattery, currentBattery, speed: calculateSpeed(cases) }
}

function pick(min, max) {
  return min + Math.random() * (max - min)
}

function setProblemParamsForCase(caseId, params) {
  switch (caseId) {
    case 'fod':
      params.metalLoss = pick(70, 120)
      params.current = pick(10, 17)
      params.resonanceAmplitude = pick(60, 82)
      params.frequency = pick(70, 81)
      break
    case 'capacitor':
      params.cap1Drift = pick(14, 25)
      params.cap2Drift = pick(12, 25)
      params.cap3Drift = pick(12, 25)
      params.cap4Drift = pick(12, 25)
      params.compensationLosses = pick(90, 150)
      params.shortCircuit = Math.random() < 0.3 ? 1 : 0
      params.fuseBlown = Math.random() < 0.2 ? 1 : 0
      break
    case 'misalignment':
      params.couplingK = pick(0.55, 0.73)
      params.airGap = pick(36, 45)
      params.lateralDistance = pick(10, 20)
      params.angle = pick(7, 12)
      break
    case 'inverter':
      params.igbtTemperature = pick(83, 95)
      break
    case 'aging':
      params.powerLosses = pick(7, 10)
      params.switchingNoise = pick(37, 45)
      params.inductanceDrift = pick(7, 12)
      params.voltageDrift = pick(7, 10)
      break
    case 'electrical':
      params.temperature = pick(85, 105)
      params.communicationQuality = pick(30, 85)
      break
    case 'thermal':
      params.transformerTemp = pick(45, 58)
      params.inverterTemp = pick(45, 58)
      params.capacitorTemp = pick(45, 58)
      params.rectifierTemp = pick(45, 58)
      params.microCoolerTemp = pick(38, 48)
      break
    case 'normal':
      params.communicationQuality = pick(40, 85)
      break
  }
}

function setSafeParamsForCase(caseId, params) {
  switch (caseId) {
    case 'fod':
      params.metalLoss = pick(0, 50)
      params.current = pick(19, 21)
      params.resonanceAmplitude = pick(95, 105)
      params.frequency = pick(85, 87)
      break
    case 'capacitor':
      params.cap1Drift = pick(-6, 6)
      params.cap2Drift = pick(-6, 6)
      params.cap3Drift = pick(-6, 6)
      params.cap4Drift = pick(-6, 6)
      params.compensationLosses = pick(10, 65)
      params.shortCircuit = 0
      params.fuseBlown = 0
      break
    case 'misalignment':
      params.couplingK = pick(0.80, 0.95)
      params.airGap = pick(22, 32)
      params.lateralDistance = pick(0, 5)
      params.angle = pick(0, 3)
      break
    case 'inverter':
      params.igbtTemperature = pick(35, 70)
      break
    case 'aging':
      params.powerLosses = pick(2, 5)
      params.switchingNoise = pick(25, 32)
      params.inductanceDrift = pick(0, 3)
      params.voltageDrift = pick(0, 3)
      break
    case 'electrical':
      params.temperature = pick(25, 50)
      params.communicationQuality = pick(92, 100)
      break
    case 'thermal':
      params.transformerTemp = pick(25, 32)
      params.inverterTemp = pick(25, 32)
      params.capacitorTemp = pick(25, 32)
      params.rectifierTemp = pick(25, 32)
      params.microCoolerTemp = pick(20, 28)
      break
    case 'normal':
      params.communicationQuality = pick(92, 100)
      break
  }
}

export { SYSTEM_COMPONENTS, ALL_CASES }
export default useStore
