"use client";

import Link from "next/link";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import DeviceToolbar, { type DeviceMode } from "@/components/DeviceToolbar";

const clampZoom = (value: number) => Math.min(200, Math.max(25, value));

export type BuilderShellRenderProps = {
  device: DeviceMode;
  onDeviceChange: (device: DeviceMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

export type BuilderStep = {
  id: string;
  label: string;
};

type NewBuilderShellProps = {
  children: ReactNode | ((props: BuilderShellRenderProps) => ReactNode);
  steps?: BuilderStep[];
  activeStep?: string;
  onStepChange?: (stepId: string) => void;
};

export default function NewBuilderShell({
  children,
  steps = [],
  activeStep,
  onStepChange,
}: NewBuilderShellProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [zoom, setZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState("100");

  const updateZoom = (nextZoom: number) => {
    const clamped = clampZoom(Math.round(nextZoom));
    setZoom(clamped);
    setZoomInput(String(clamped));
  };

  const changeZoomBy = (delta: number) => updateZoom(zoom + delta);

  const handleZoomInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setZoomInput(event.target.value);
  };

  const commitZoomFromInput = () => {
    const parsed = parseInt(zoomInput, 10);
    if (Number.isNaN(parsed)) {
      setZoomInput(String(zoom));
      return;
    }
    updateZoom(parsed);
  };

  const renderChildren =
    typeof children === "function"
      ? (children as (props: BuilderShellRenderProps) => ReactNode)
      : null;

  const childContent = renderChildren
    ? renderChildren({
        device,
        onDeviceChange: setDevice,
        zoom,
        onZoomChange: updateZoom,
      })
    : children;

  return (
    <div className="builder-container">
      <header className="builder-header">
        <div className="builder-header-left">
          <Link href="/" className="builder-logo">
            Prosite
          </Link>
          {steps.length > 0 ? (
            <nav className="step-nav-horizontal" aria-label="Builder steps">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className={`step-nav-item${
                    activeStep === step.id ? " active" : ""
                  }`}
                  onClick={() => onStepChange?.(step.id)}
                  aria-current={activeStep === step.id ? "step" : undefined}
                >
                  <span className="step-pill">{index + 1}</span>
                  <span className="step-label">{step.label}</span>
                </button>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="builder-header-right">
          <DeviceToolbar selectedDevice={device} onDeviceChange={setDevice} />
          <div className="zoom-controls" aria-label="Preview zoom controls">
            <button
              type="button"
              className="zoom-button"
              onClick={() => changeZoomBy(-10)}
              aria-label="Zoom out"
            >
              –
            </button>
            <div className="zoom-input">
              <input
                type="number"
                min={25}
                max={200}
                value={zoomInput}
                onChange={handleZoomInputChange}
                onBlur={commitZoomFromInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                aria-label="Zoom percentage"
              />
              <span className="suffix">%</span>
            </div>
            <button
              type="button"
              className="zoom-button"
              onClick={() => changeZoomBy(10)}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </header>

      <div className="builder-body">{childContent}</div>
    </div>
  );
}
