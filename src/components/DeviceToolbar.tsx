"use client";
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)
export type DeviceMode = "desktop" | "tablet" | "mobile";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faTabletAlt, faMobileAlt } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

// define type
// type DeviceMode = "desktop" | "tablet" | "mobile";

type DeviceToolbarProps = {
  selectedDevice: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
};




const DEVICE_OPTIONS: { id: DeviceMode; label: string; icon: IconProp }[] = [
  { id: "desktop", label: "Desktop", icon: faDesktop },
  { id: "tablet",  label: "Tablet",  icon: faTabletAlt },
  { id: "mobile",  label: "Mobile",  icon: faMobileAlt },
];


export default function DeviceToolbar({ selectedDevice, onDeviceChange }: DeviceToolbarProps) {
  return (
    <div className="device-toolbar">
      {DEVICE_OPTIONS.map((device) => (
        <button
          key={device.id}
          type="button"
          className={`device-button${selectedDevice === device.id ? " active" : ""}`}
          onClick={() => onDeviceChange(device.id)}
          aria-pressed={selectedDevice === device.id}
        >
          <FontAwesomeIcon icon={device.icon} className="icon" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
