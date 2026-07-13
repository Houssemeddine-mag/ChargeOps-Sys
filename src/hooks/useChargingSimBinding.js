import { useMemo } from 'react'
import useStore from '../store/simulationStore'

export default function useChargingSimBinding() {
  const vehicle = useStore(s => s.currentVehicle)
  const charging = useStore(s => s.charging)
  const detail = useStore(s => s.chargingSimDetail)

  return useMemo(() => {
    const p = vehicle?.params || {}
    const k = p.couplingK || 0
    const airGap = p.airGap || 0
    const lateralDist = p.lateralDistance || 0
    const angle = p.angle || 0
    const soc = charging.currentBattery || 0
    const status = charging.status
    const speed = charging.speed || 0

    const isActive = status === 'charging'
    const powerFlow = isActive ? speed : 0

    const efficiency = detail.stageEfficiencies
    const maxPower = 400 * 25

    return {
      gridAC: {
        voltage: detail.gridVoltage,
        current: detail.gridCurrent,
        power: detail.gridVoltage * detail.gridCurrent,
        frequency: 50,
      },
      dcBus: {
        voltage: detail.dcBusVoltage,
        current: detail.dcBusCurrent,
        power: detail.dcBusVoltage * detail.dcBusCurrent,
      },
      hfAC: {
        voltage: detail.hfVoltage,
        current: detail.hfCurrent,
        power: detail.hfVoltage * detail.hfCurrent,
        frequency: detail.hfFrequency,
      },
      txCoil: {
        power: detail.txPower,
        current: detail.hfCurrent,
      },
      rxCoil: {
        power: detail.rxPower,
        voltage: detail.rxVoltage,
        current: detail.rxCurrent,
      },
      rectDc: {
        voltage: detail.rectDcVoltage,
        current: detail.rectDcCurrent,
        power: detail.rectDcVoltage * detail.rectDcCurrent,
      },
      dcdcOut: {
        voltage: detail.dcdcVoltage,
        current: detail.dcdcCurrent,
        power: detail.dcdcVoltage * detail.dcdcCurrent,
      },
      battery: {
        voltage: detail.batteryVoltage,
        current: detail.batteryCurrent,
        soc,
        power: detail.batteryVoltage * detail.batteryCurrent,
      },
      efficiency,
      couplingK: k,
      airGap,
      lateralDistance: lateralDist,
      angle,
      powerFlow,
      soc,
      status,
      waveforms: detail.waveforms,
      isActive,
      maxPower,
    }
  }, [vehicle, charging, detail])
}
