import { jsPDF } from 'jspdf'

export function generateReportPDF(vehicle, caseResults, chargingHistory, systemStates) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 20
  const contentW = pageW - 2 * margin
  let y = margin

  function addSection(title, contentFn) {
    if (y > 260) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(220, 38, 38)
    doc.text(title, margin, y)
    y += 8
    doc.setDrawColor(220, 38, 38)
    doc.line(margin, y, pageW - margin, y)
    y += 6
    contentFn()
  }

  function addText(text, size = 10, bold = false) {
    if (y > 270) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(size)
    doc.setFont(undefined, bold ? 'bold' : 'normal')
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(text, contentW)
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.45) + 2
  }

  function addLine(label, value) {
    addText(`${label}: ${value}`)
  }

  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, pageW, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text('ChargeOps Sys', margin + 5, 18)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text('Wireless EV Charging Diagnostic Report', margin + 5, 28)
  y = 45

  addSection('Vehicle Information', () => {
    addLine('Vehicle ID', vehicle.id)
    addLine('Generated', new Date(vehicle.generatedAt).toLocaleString())
    addLine('Entry Battery', `${vehicle.params.entryBattery}%`)
    addLine('Target', '100% (Full Charge)')
  })

  addSection('System States', () => {
    addLine('Power Supply', systemStates.powerSupply === 'OK' ? 'OK' : 'ERROR')
    addLine('Controller', systemStates.controller === 'OK' ? 'OK' : 'ERROR')
    addLine('Sensors', systemStates.sensors === 'OK' ? 'OK' : 'ERROR')
    addLine('Communication', systemStates.communication === 'OK' ? 'OK' : 'ERROR')
  })

  addSection('Key Parameters', () => {
    const p = vehicle.params
    addLine('Voltage', `${p.voltage.toFixed(1)} V`)
    addLine('Current', `${p.current.toFixed(1)} A`)
    addLine('Temperature', `${p.temperature.toFixed(1)} \u00b0C`)
    addLine('Frequency', `${p.frequency.toFixed(2)} kHz`)
    addLine('Coupling (k)', p.couplingK.toFixed(3))
    addLine('Air Gap', `${p.airGap.toFixed(1)} cm`)
  })

  addSection('Diagnostic Results', () => {
    const caseNames = {
      normal: 'Normal Self-Diagnosis',
      fod: 'Foreign Object Detection',
      capacitor: 'Capacitor / Compensation',
      misalignment: 'Misalignment',
      inverter: 'Inverter Fault',
      aging: 'Component Aging',
      electrical: 'Electronics / Power Supply',
      thermal: 'Thermal Monitoring',
    }
    caseResults.forEach(c => {
      const statusIcon = c.status === 'active' ? '[x]' : c.status === 'resolved' ? '[R]' : '[v]'
      addText(`${statusIcon} ${caseNames[c.caseId] || c.caseId}: ${c.detail || c.status}`, 10)
    })
  })

  addSection('Charging Summary', () => {
    const totalDuration = chargingHistory.length
    const blockedEvents = chargingHistory.filter(h => h.status === 'blocked').length
    const resolvedCount = caseResults.filter(c => c.status === 'resolved').length
    const totalIssues = caseResults.filter(c => c.status === 'active' || c.status === 'resolved').length
    const finalBattery = chargingHistory.length > 0 ? chargingHistory[chargingHistory.length - 1].battery : vehicle.params.entryBattery

    addLine('Duration', `${totalDuration} cycles simulated`)
    addLine('Issues Encountered', totalIssues.toString())
    addLine('Issues Resolved', resolvedCount.toString())
    addLine('Charging Blockages', blockedEvents.toString())
    addLine('Final Battery Level', `${finalBattery.toFixed(0)}%`)
    addLine('Result', finalBattery >= 99 ? 'Fully charged' : finalBattery > vehicle.params.entryBattery ? `Partially charged (${finalBattery.toFixed(0)}%)` : 'Charging failed')
  })

  addSection('Notes', () => {
    addText('This report was generated automatically by ChargeOps Sys. The simulation is based on the diagnostic algorithms defined in the system specifications.', 9)
  })

  const footerY = 285
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, footerY)

  return doc.output('arraybuffer')
}
