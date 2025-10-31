"use client";
import { useState } from "react";

export default function PreviewArea() {
  const [title] = useState("www.mysite.com");
  const [logo] = useState("https://dummyimage.com/20x20/fff/000.png&text=L");

  return (
    <section className="preview-area">
      <div className="preview-toolbar">
        <div className="device-icons">
          <span>DESKTOP • 100%</span>
          <span>🖥️</span>
          <span>📱</span>
        </div>
        <span className="step-info">STEP 2 OF 3 • Branding</span>
      </div>

      <div className="preview-wrapper">
        <div className="browser-bar">
          <div className="browser-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>
          <div className="browser-url">
            {logo && <img src={logo} alt="Logo" />}
            <span>{title}</span>
          </div>
        </div>
        <div className="preview-screen">
          <h1>Preview Screen</h1>
        </div>
      </div>

      <div className="preview-footer">
        <button className="btn-primary" type="button">
          Full Preview
        </button>
      </div>
    </section>
  );
}
