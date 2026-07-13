const CASE_IDS = {
  NORMAL: 'normal',
  FOD: 'fod',
  CAPACITOR: 'capacitor',
  MISALIGNMENT: 'misalignment',
  INVERTER: 'inverter',
  AGING: 'aging',
  ELECTRICAL: 'electrical',
  THERMAL: 'thermal',
}

function evaluateCase(caseId, vehicle, systemStates) {
  const p = vehicle.params

  switch (caseId) {
    case CASE_IDS.NORMAL:
      return evaluateNormal(p)
    case CASE_IDS.FOD:
      return evaluateFOD(p)
    case CASE_IDS.CAPACITOR:
      return evaluateCapacitor(p)
    case CASE_IDS.MISALIGNMENT:
      return evaluateMisalignment(p)
    case CASE_IDS.INVERTER:
      return evaluateInverter(p, systemStates)
    case CASE_IDS.AGING:
      return evaluateAging(p)
    case CASE_IDS.ELECTRICAL:
      return evaluateElectrical(p)
    case CASE_IDS.THERMAL:
      return evaluateThermal(p)
    default:
      return { triggered: false, severity: 'ok', details: 'Unknown case' }
  }
}

function evaluateNormal(p) {
  const voltageOK = p.voltage >= 390 && p.voltage <= 410
  const currentOK = p.current >= 22 && p.current <= 28
  const tempOK = p.temperature < 60
  const freqOK = p.frequency >= 85 && p.frequency <= 87
  const commOK = p.communicationQuality >= 90
  const allOK = voltageOK && currentOK && tempOK && freqOK && commOK

  return {
    triggered: !allOK,
    severity: allOK ? 'ok' : 'warning',
    details: allOK
      ? 'All parameters within acceptable limits.'
      : [
          !voltageOK && 'Voltage out of range (390-410V)',
          !currentOK && 'Current out of range (22-28A)',
          !tempOK && 'High temperature (>60\u00b0C)',
          !freqOK && 'Frequency drift (85-87kHz)',
          !commOK && 'Poor communication (<90%)',
        ].filter(Boolean).join(', '),
    steps: [
      { name: 'Initial Self-Diagnostics', status: 'complete', detail: 'System booted' },
      { name: 'Parameter Validation', status: allOK ? 'pass' : 'fail', detail: allOK ? `V=${p.voltage.toFixed(1)}V, I=${p.current.toFixed(1)}A, T=${p.temperature.toFixed(1)}\u00b0C, F=${p.frequency.toFixed(1)}kHz, Comm=${p.communicationQuality.toFixed(0)}%` : [!voltageOK && `V=${p.voltage.toFixed(1)}V (390-410V)`, !currentOK && `I=${p.current.toFixed(1)}A (22-28A)`, !tempOK && `T=${p.temperature.toFixed(1)}\u00b0C (<60\u00b0C)`, !freqOK && `F=${p.frequency.toFixed(1)}kHz (85-87kHz)`, !commOK && `Comm=${p.communicationQuality.toFixed(0)}% (>=90%)`].filter(Boolean).join(', ') },
      { name: 'Automatic Adjustment', status: allOK ? 'pass' : 'skipped', detail: allOK ? 'Calibration successful' : 'Proceeding to diagnostic' },
      { name: 'Vehicle Detection', status: 'pending', detail: 'Waiting for vehicle' },
      { name: 'Charging', status: 'pending', detail: 'Ready to charge' },
    ],
  }
}

function evaluateFOD(p) {
  const currentDeviation = Math.abs(p.current - 20)
  const freqDeviation = Math.abs(p.frequency - 85)
  const ampDeviation = Math.abs(p.resonanceAmplitude - 100)
  const metalLossHigh = p.metalLoss > 60

  const currentFault = currentDeviation > 2
  const freqFault = freqDeviation > 3
  const ampFault = ampDeviation > 15
  const lossFault = metalLossHigh

  const triggered = currentFault || freqFault || ampFault || lossFault

  return {
    triggered,
    severity: triggered ? 'critical' : 'ok',
    details: triggered
      ? [
          currentFault && 'Current deviation',
          freqFault && 'Frequency deviation',
          ampFault && 'Amplitude deviation',
          lossFault && 'Metal loss detected',
        ].filter(Boolean).join(', ')
      : 'No foreign object detected.',
    steps: [
      { name: 'Initial Self-Diagnostics', status: triggered ? 'complete' : 'complete', detail: 'Sensors active' },
      { name: 'Current Check', status: currentFault ? 'fail' : 'pass', detail: `Deviation: ${currentDeviation.toFixed(2)}A (limit: 2A)` },
      { name: 'Frequency Check', status: freqFault ? 'fail' : 'pass', detail: `Deviation: ${freqDeviation.toFixed(2)}kHz (limit: 3kHz)` },
      { name: 'Amplitude Check', status: ampFault ? 'fail' : 'pass', detail: `Deviation: ${ampDeviation.toFixed(2)}% (limit: 15%)` },
      { name: 'Metal Loss Check', status: lossFault ? 'fail' : 'pass', detail: `Loss: ${p.metalLoss.toFixed(1)}W (limit: 60W)` },
      { name: 'Decision', status: triggered ? 'fail' : 'pass', detail: triggered ? 'FOREIGN OBJECT DETECTED - Power OFF' : 'No FOD - Normal operation' },
    ],
    blocksCharging: triggered,
  }
}

function evaluateCapacitor(p) {
  const voltageOK = p.voltage >= 360 && p.voltage <= 440
  const capTolerance = 10
  const caps = [p.cap1Drift, p.cap2Drift, p.cap3Drift, p.cap4Drift]
  const capFaults = caps.map(drift => Math.abs(drift) > capTolerance)
  const lossFault = p.compensationLosses > 80
  const shortCircuit = p.shortCircuit === 1
  const fuseBlown = p.fuseBlown === 1

  const triggered = !voltageOK || capFaults.some(Boolean) || lossFault || shortCircuit || fuseBlown

  return {
    triggered,
    severity: triggered ? (shortCircuit || fuseBlown ? 'critical' : 'warning') : 'ok',
    details: triggered
      ? [
          !voltageOK && 'Voltage out of range',
          capFaults.some(Boolean) && `Capacitor(s) C${caps.map((f, i) => f ? i + 1 : null).filter(Boolean).join(', ')} drifted`,
          lossFault && 'High compensation losses',
          shortCircuit && 'Short circuit detected',
          fuseBlown && 'Fuse blown',
        ].filter(Boolean).join(', ')
      : 'Compensation network OK.',
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'All modules OK' },
      { name: 'Voltage Check', status: voltageOK ? 'pass' : 'fail', detail: `${p.voltage.toFixed(1)}V (range: 360-440V)` },
      { name: 'Capacitor Drift Check', status: capFaults.some(Boolean) ? 'fail' : 'pass', detail: capFaults.some(Boolean) ? `C${caps.map((f, i) => f ? i + 1 : null).filter(Boolean).join(', ')} out of tolerance` : 'All capacitors OK' },
      { name: 'Loss Check', status: lossFault ? 'fail' : 'pass', detail: `${p.compensationLosses.toFixed(1)}W (limit: 80W)` },
      { name: 'Short Circuit / Fuse Check', status: shortCircuit || fuseBlown ? 'fail' : 'pass', detail: shortCircuit ? 'SHORT CIRCUIT' : fuseBlown ? 'FUSE BLOWN' : 'No faults' },
      { name: 'Degraded Mode', status: triggered && !shortCircuit && !fuseBlown ? 'available' : triggered ? 'unavailable' : 'noneeded', detail: triggered && !shortCircuit && !fuseBlown ? 'Degraded mode activated' : 'Normal operation' },
    ],
    blocksCharging: shortCircuit || fuseBlown,
  }
}

function evaluateMisalignment(p) {
  const airGapOK = p.airGap >= 20 && p.airGap <= 35
  const lateralOK = p.lateralDistance <= 8
  const angleOK = p.angle <= 5
  const couplingOK = p.couplingK >= 0.75

  const triggered = !airGapOK || !lateralOK || !angleOK || !couplingOK

  return {
    triggered,
    severity: triggered ? (p.couplingK < 0.75 ? 'critical' : 'warning') : 'ok',
    details: triggered
      ? [
          !airGapOK && `Air gap ${p.airGap.toFixed(1)}cm (limits: 20-35cm)`,
          !lateralOK && `Lateral ${p.lateralDistance.toFixed(1)}cm (limit: 8cm)`,
          !angleOK && `Angle ${p.angle.toFixed(1)}\u00b0 (limit: 5\u00b0)`,
          !couplingOK && `Coupling k=${p.couplingK.toFixed(3)} (min: 0.75)`,
        ].filter(Boolean).join(', ')
      : 'Alignment within limits.',
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'Ready' },
      { name: 'Air Gap Measurement', status: airGapOK ? 'pass' : 'fail', detail: `${p.airGap.toFixed(1)}cm (limits: 20-35cm)` },
      { name: 'Lateral Distance', status: lateralOK ? 'pass' : 'fail', detail: `${p.lateralDistance.toFixed(1)}cm (limit: 8cm)` },
      { name: 'Angular Misalignment', status: angleOK ? 'pass' : 'fail', detail: `${p.angle.toFixed(1)}\u00b0 (limit: 5\u00b0)` },
      { name: 'Coupling Coefficient', status: couplingOK ? 'pass' : 'fail', detail: `k=${p.couplingK.toFixed(3)} (min: 0.75)` },
      { name: 'Correction Attempt', status: triggered ? 'pending' : 'pass', detail: triggered ? 'Adjusting position...' : 'Charging started' },
    ],
    blocksCharging: p.couplingK < 0.75,
  }
}

function evaluateInverter(p, systemStates) {
  const voltageOK = p.voltage >= 380 && p.voltage <= 400
  const currentOK = p.current >= 15 && p.current <= 20
  const tempOK = p.igbtTemperature < 80
  const hasFault = !voltageOK || !currentOK || !tempOK || systemStates.powerSupply === 'ER' || systemStates.controller === 'ER'

  return {
    triggered: hasFault,
    severity: hasFault ? 'critical' : 'ok',
    details: hasFault
      ? [
          !voltageOK && 'Voltage outside range (380-400V)',
          !currentOK && 'Current outside range (15-20A)',
          !tempOK && 'IGBT over temperature',
          systemStates.powerSupply === 'ER' && 'Power supply error',
          systemStates.controller === 'ER' && 'Controller error',
        ].filter(Boolean).join(', ')
      : 'Inverter operating normally.',
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'Power, Controller, DSP OK' },
      { name: 'Voltage Measurement', status: voltageOK ? 'pass' : 'fail', detail: `${p.voltage.toFixed(1)}V (range: 380-400V)` },
      { name: 'Current Measurement', status: currentOK ? 'pass' : 'fail', detail: `${p.current.toFixed(1)}A (range: 15-20A)` },
      { name: 'IGBT Temperature', status: tempOK ? 'pass' : 'fail', detail: `${p.igbtTemperature.toFixed(1)}\u00b0C (limit: 80\u00b0C)` },
      { name: 'Emergency Shutdown', status: hasFault ? 'fail' : 'pass', detail: hasFault ? 'Power Supply OFF' : 'No fault' },
      { name: 'Reset Attempt', status: 'pending', detail: 'Attempting reset...' },
      { name: 'Recovery', status: 'pending', detail: 'Waiting for recovery' },
    ],
    blocksCharging: hasFault,
  }
}

function evaluateAging(p) {
  const lossOK = p.powerLosses < 6
  const noiseOK = p.switchingNoise < 35
  const inductanceOK = p.inductanceDrift < 5
  const voltageDriftOK = p.voltageDrift < 5

  const triggered = !lossOK || !noiseOK || !inductanceOK || !voltageDriftOK

  let agingScore = 0
  if (!lossOK) agingScore += 25
  if (!noiseOK) agingScore += 25
  if (!inductanceOK) agingScore += 25
  if (!voltageDriftOK) agingScore += 25

  const condition = agingScore <= 25 ? 'GOOD' : agingScore <= 50 ? 'MODERATE AGING' : agingScore <= 75 ? 'SEVERE AGING' : 'CRITICAL'

  return {
    triggered,
    severity: triggered ? (agingScore > 50 ? 'warning' : 'info') : 'ok',
    details: triggered
      ? `Aging Score: ${agingScore}% - ${condition}. ` + [
          !lossOK && 'Increased losses',
          !noiseOK && 'High switching noise',
          !inductanceOK && 'Inductance drift',
          !voltageDriftOK && 'Voltage drift',
        ].filter(Boolean).join(', ')
      : 'No aging detected.',
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'Monitoring initialized' },
      { name: 'Power Loss Check', status: lossOK ? 'pass' : 'fail', detail: `${p.powerLosses.toFixed(1)}% (limit: 6%)` },
      { name: 'Switching Noise', status: noiseOK ? 'pass' : 'fail', detail: `${p.switchingNoise.toFixed(1)}dB (limit: 35dB)` },
      { name: 'Inductance Drift', status: inductanceOK ? 'pass' : 'fail', detail: `${p.inductanceDrift.toFixed(1)}% (limit: 5%)` },
      { name: 'Voltage Drift', status: voltageDriftOK ? 'pass' : 'fail', detail: `${p.voltageDrift.toFixed(1)}% (limit: 5%)` },
      { name: 'Compensation', status: triggered ? 'active' : 'noneeded', detail: `Aging Score: ${agingScore}% - ${condition}` },
      { name: 'Maintenance Plan', status: condition === 'GOOD' ? 'noneeded' : 'required', detail: condition === 'CRITICAL' ? 'Immediate maintenance required' : `Maintenance within ${condition === 'MODERATE AGING' ? '6' : '3'} months` },
    ],
    blocksCharging: false,
  }
}

function evaluateElectrical(p) {
  const overvoltage = p.voltage > 400
  const undervoltage = p.voltage < 380
  const overcurrent = p.current > 20
  const lossComm = p.communicationQuality < 90
  const overTemp = p.temperature > 80
  const triggerVoltage = overvoltage || undervoltage
  const triggered = triggerVoltage || overcurrent || lossComm || overTemp

  let faultType = 'Normal'
  let maintenanceTarget = ''
  if (overvoltage) { faultType = 'Overvoltage'; maintenanceTarget = 'Voltage Sensor' }
  else if (undervoltage) { faultType = 'Undervoltage'; maintenanceTarget = 'Voltage Sensor' }
  else if (overcurrent) { faultType = 'Short Circuit / Overcurrent'; maintenanceTarget = 'Current Sensor' }
  else if (lossComm) { faultType = 'Loss of Communication'; maintenanceTarget = 'Communication Module' }
  else if (overTemp) { faultType = 'Temperature Protection'; maintenanceTarget = 'Temperature Sensor' }

  return {
    triggered,
    severity: triggered ? 'critical' : 'ok',
    details: triggered ? `${faultType} detected` : 'No electronic fault.',
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'All sensors OK' },
      { name: 'Voltage Test', status: triggerVoltage ? 'fail' : 'pass', detail: `${p.voltage.toFixed(1)}V (range: 380-400V)` },
      { name: 'Current Test', status: !overcurrent ? 'pass' : 'fail', detail: `${p.current.toFixed(1)}A (limit: 20A)` },
      { name: 'Communication Test', status: !lossComm ? 'pass' : 'fail', detail: `Comm: ${p.communicationQuality.toFixed(0)}% (limit: 90%)` },
      { name: 'Temperature Test', status: !overTemp ? 'pass' : 'fail', detail: `${p.temperature.toFixed(1)}\u00b0C (limit: 80\u00b0C)` },
      { name: 'Fault Identification', status: triggered ? 'fail' : 'pass', detail: triggered ? `Fault: ${faultType}` : 'No fault' },
      { name: 'Maintenance Required', status: triggered ? 'required' : 'none', detail: triggered ? `Check ${maintenanceTarget}` : 'System OK' },
    ],
    blocksCharging: triggered,
  }
}

function evaluateThermal(p) {
  const temps = [p.transformerTemp, p.inverterTemp, p.capacitorTemp, p.rectifierTemp, p.microCoolerTemp]
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length
  const triggered = avgTemp >= 35

  return {
    triggered,
    severity: triggered ? (avgTemp > 45 ? 'critical' : 'warning') : 'ok',
    details: triggered
      ? `Average temp ${avgTemp.toFixed(1)}\u00b0C exceeds 35\u00b0C limit`
      : `Average temp ${avgTemp.toFixed(1)}\u00b0C - normal.`,
    steps: [
      { name: 'System Startup', status: 'complete', detail: 'Cooling system OK' },
      { name: 'Transformer Temp', status: p.transformerTemp < 40 ? 'pass' : 'warn', detail: `${p.transformerTemp.toFixed(1)}\u00b0C` },
      { name: 'Inverter Temp', status: p.inverterTemp < 45 ? 'pass' : 'warn', detail: `${p.inverterTemp.toFixed(1)}\u00b0C` },
      { name: 'Capacitor Temp', status: p.capacitorTemp < 40 ? 'pass' : 'warn', detail: `${p.capacitorTemp.toFixed(1)}\u00b0C` },
      { name: 'Rectifier Temp', status: p.rectifierTemp < 43 ? 'pass' : 'warn', detail: `${p.rectifierTemp.toFixed(1)}\u00b0C` },
      { name: 'Average Temperature', status: triggered ? 'fail' : 'pass', detail: `Avg: ${avgTemp.toFixed(1)}\u00b0C (limit: 35\u00b0C)` },
      { name: 'Power Reduction', status: triggered ? 'active' : 'noneeded', detail: triggered ? `Reducing power 50% (current: ${avgTemp.toFixed(1)}\u00b0C)` : 'Normal operation' },
      { name: 'Safety Check', status: triggered ? (avgTemp > 45 ? 'emergency' : 'monitoring') : 'pass', detail: triggered && avgTemp > 45 ? 'EMERGENCY STOP required' : 'Monitoring' },
    ],
    blocksCharging: avgTemp > 45,
  }
}

export { CASE_IDS, evaluateCase }
