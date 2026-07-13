<div align="center">

# ⚡ ChargeOps Sys

### Wireless EV Charging Diagnostic Simulation System

A real-time simulation platform for **wireless electric vehicle charging** that models the complete power transfer chain, detects faults automatically, and provides step-by-step diagnostic resolution — all through an immersive 3D visualization.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=three.js)](https://threejs.org)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron)](https://www.electronjs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## The Problem

Wireless EV charging systems are complex. When something goes wrong — a foreign object between the coils, a misaligned pad, a degrading capacitor, or an overheating inverter — technicians need to **identify the problem fast** and understand exactly what's happening inside the system.

Traditional diagnostic tools show raw numbers. ChargeOps Sys shows you the **full picture** — a living, breathing 3D model of the charging system with real-time power flow, fault indicators, and guided resolution steps.

---

## What ChargeOps Sys Does

### 🔋 Simulates Real Charging

Generate a virtual vehicle with realistic parameters. The system models the **complete 11-stage wireless power transfer chain**:

```
AC Grid → AC/DC Converter → Capacitor → HF Inverter → Tx Coil
         ↕ (magnetic coupling)
Rx Coil → HF Rectifier → Capacitor → DC/DC Converter → Battery
```

Each stage has real voltages, currents, efficiencies, and waveforms that update in real time.

### 🔍 Detects 8 Types of Faults

The system continuously monitors for real-world charging problems:

| Fault | What Happens | Impact |
|-------|-------------|--------|
| **Foreign Object (FOD)** | Metal debris detected between coils | Stops charging |
| **Coil Misalignment** | Pads not aligned properly | Stops charging |
| **Capacitor Fault** | Drift, short circuit, or blown fuse | Stops charging |
| **Inverter Fault** | IGBT over-temperature or component failure | Stops charging |
| **Electrical Fault** | Overvoltage, overcurrent, or communication loss | Stops charging |
| **Thermal Fault** | System overheating across 5 sensors | Stops charging |
| **Component Aging** | Gradual wear and degradation | Reduces speed |
| **Normal Diagnosis** | Routine self-check of core parameters | Warning only |

### 🛠️ Guides You Through Resolution

Each fault comes with a **step-by-step diagnostic procedure** — just like a real technician would follow:

1. Run initial self-diagnostics
2. Check current readings against thresholds
3. Verify frequency and amplitude
4. Inspect physical parameters
5. Make a decision and resolve

You walk through each step, see the actual measurements vs. limits, and resolve the issue when ready.

### 🌐 Visualizes Everything in 3D

The 3D view brings the invisible to life:

- **Live power flow** through every component
- **Magnetic field lines** between transmitter and receiver coils
- **Red warning indicators** on damaged components
- **Foreign object visualization** — see exactly where the debris is, its coordinates, and dimensions (hover to inspect)
- **Real-time waveforms** — oscilloscope-style graphs for each signal stage
- **Alignment controls** — drag sliders to shift air gap, lateral offset, and angle and watch the coupling coefficient change instantly

### 📊 Generates Diagnostic Reports

When charging completes, the system produces a **PDF report** containing:

- Vehicle information and parameters
- System component status
- Full diagnostic results for all 8 cases
- Charging summary with duration and issues
- Timestamped and formatted for printing

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    CHARGEOPS SYS                         │
├──────────────┬──────────────────────┬───────────────────┤
│              │                      │                   │
│  SIDEBAR     │    MAIN DASHBOARD    │   3D VIEW         │
│              │                      │                   │
│  Parameters  │  Vehicle Overview    │  Charging Scene   │
│  Sliders     │  Charging Bar        │  Live Readouts    │
│  Case Toggles│  8 Diagnostic Cards  │  Waveforms        │
│  Diagnostics │  System Controls     │  Alignment        │
│              │                      │  FOD Viewer       │
│              │       ↕              │                   │
│              │   PDF Report         │                   │
└──────────────┴──────────────────────┴───────────────────┘
```

1. **Generate a vehicle** — The system creates a random EV with specific parameters and hidden faults
2. **Explore the dashboard** — See all parameters, toggle faults on/off, adjust values in real time
3. **Diagnose problems** — Click any active fault to walk through the diagnostic procedure
4. **Switch to 3D** — See the physical system, power flow, and faults visualized in real time
5. **Resolve and charge** — Fix all issues, start charging, and watch the battery fill up
6. **Get your report** — Download a complete PDF summary of the session

---

## Key Features at a Glance

| Feature | Description |
|---------|-------------|
| **Real-time Simulation** | Live battery charging with variable speed based on active faults |
| **11-Stage Power Chain** | Complete model from AC grid to DC battery with per-stage efficiency |
| **8 Diagnostic Cases** | Automated detection with severity levels and blocking logic |
| **Step-Through Diagnosis** | Guided fault resolution with measurements and thresholds |
| **3D Immersive View** | Three.js scene with coils, field lines, power flow, and warnings |
| **FOD Visualization** | Foreign object rendered with coordinates and dimensions on hover |
| **Component Damage Alerts** | Red warning indicators on faulty components in the 3D scene |
| **Live Waveforms** | Oscilloscope-style graphs for grid, inverter, induced, and DC signals |
| **Alignment Controls** | Interactive sliders for air gap, lateral offset, and angular offset |
| **System Component Toggle** | Simulate failures in power supply, controller, sensors, communication |
| **PDF Report Generation** | Formatted diagnostic report with all session data |
| **Simulation Controls** | Play/pause and speed multiplier (1x, 5x, 20x) |
| **Electron Desktop** | Runs as a native desktop application |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm

### Installation

```bash
git clone https://github.com/Houssemeddine-mag/ChargeOps-Sys.git
cd ChargeOps-Sys
npm install
```

### Run in Browser

```bash
npm run dev
```

### Run as Desktop App (Electron)

```bash
npm run electron:dev
```

### Build for Production

```bash
npm run build
```

---

## Use Cases

- **Education** — Teach wireless power transfer concepts with a hands-on, visual simulator
- **Training** — Train technicians on fault diagnosis procedures without needing physical hardware
- **Research** — Experiment with parameter changes and observe their effect on charging performance
- **Demonstration** — Showcase wireless EV charging technology to stakeholders and clients

---

## Built With

| Technology | Role |
|-----------|------|
| **React 19** | UI framework |
| **Vite 8** | Build tooling |
| **Zustand 5** | State management |
| **Tailwind CSS 4** | Styling |
| **Three.js** + **React Three Fiber** + **Drei** | 3D rendering |
| **jsPDF** | PDF report generation |
| **Electron** | Desktop application |

---

<div align="center">

**ChargeOps Sys** — Making wireless EV charging diagnostics visual, intuitive, and actionable.

</div>
