function rand(min, max) {
  return min + Math.random() * (max - min)
}

function randInt(min, max) {
  if (max <= min) return min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(min, max) {
  return rand(min, max)
}

function pickInt(min, max) {
  return randInt(min, max)
}

let vehicleCounter = 0

function pickCasesToTrigger() {
  const all = ['fod', 'capacitor', 'misalignment', 'inverter', 'aging', 'electrical', 'thermal', 'normal']
  const count = pickInt(0, 5)
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function generateVehicle() {
  vehicleCounter++
  const triggerCases = pickCasesToTrigger()
  const triggerSet = new Set(triggerCases)

  const params = {}

  params.metalLoss = triggerSet.has('fod') ? pick(65, 120) : pick(0, 55)
  params.current = triggerSet.has('fod') ? pick(10, 17) : pick(19, 21)
  params.resonanceAmplitude = triggerSet.has('fod') ? pick(70, 84) : pick(95, 105)
  params.frequency = triggerSet.has('fod') ? pick(70, 81) : pick(85, 87)

  params.cap1Drift = triggerSet.has('capacitor') ? pick(12, 25) : pick(-8, 8)
  params.cap2Drift = triggerSet.has('capacitor') ? pick(12, 25) : pick(-8, 8)
  params.cap3Drift = pick(-8, 8)
  params.cap4Drift = pick(-8, 8)
  params.compensationLosses = triggerSet.has('capacitor') ? pick(85, 150) : pick(10, 70)
  params.shortCircuit = triggerSet.has('capacitor') && Math.random() < 0.3 ? 1 : 0
  params.fuseBlown = triggerSet.has('capacitor') && Math.random() < 0.2 ? 1 : 0

  params.couplingK = triggerSet.has('misalignment') ? pick(0.60, 0.74) : pick(0.78, 0.95)
  params.airGap = triggerSet.has('misalignment') ? pick(26, 45) : pick(12, 24)
  params.lateralDistance = triggerSet.has('misalignment') ? pick(9, 20) : pick(0, 6)
  params.angle = triggerSet.has('misalignment') ? pick(6, 12) : pick(0, 4)

  params.igbtTemperature = triggerSet.has('inverter') ? pick(82, 90) : pick(35, 75)

  params.powerLosses = triggerSet.has('aging') ? pick(6.1, 10) : pick(2, 5.5)
  params.switchingNoise = triggerSet.has('aging') ? pick(36, 45) : pick(25, 33)
  params.inductanceDrift = triggerSet.has('aging') ? pick(6, 12) : pick(0, 4)
  params.voltageDrift = triggerSet.has('aging') ? pick(6, 10) : pick(0, 4)

  params.temperature = triggerSet.has('electrical') ? pick(82, 105) : pick(25, 55)

  params.transformerTemp = triggerSet.has('thermal') ? pick(42, 55) : pick(25, 33)
  params.inverterTemp = triggerSet.has('thermal') ? pick(42, 55) : pick(25, 33)
  params.capacitorTemp = triggerSet.has('thermal') ? pick(42, 55) : pick(25, 33)
  params.rectifierTemp = triggerSet.has('thermal') ? pick(42, 55) : pick(25, 33)
  params.microCoolerTemp = triggerSet.has('thermal') ? pick(35, 45) : pick(20, 30)

  params.communicationQuality = triggerSet.has('normal') ? pick(50, 88) : pick(91, 100)

  params.voltage = pick(385, 415)

  params.entryBattery = pickInt(10, 50)

  const id = `VHC-${String(vehicleCounter).padStart(3, '0')}`
  const generatedAt = new Date().toISOString()

  return { id, params, generatedAt }
}


