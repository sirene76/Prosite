"use client";

export type DeviceMode = "desktop" | "tablet" | "mobile";

type DeviceToolbarProps = {
  selectedDevice: DeviceMode;
  onDeviceChange: (mode: DeviceMode) => void;
};

const DEVICE_OPTIONS: { id: DeviceMode; label: string; icon: string }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥️" },
  { id: "tablet", label: "Tablet", icon: "📲" },
  { id: "mobile", label: "Mobile", icon: "📱" },
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
          <span className="icon" aria-hidden="true">
            {device.icon}
          </span>
          <span>{device.label}</span>
        </button>
      ))}
    </div>
  );
}
