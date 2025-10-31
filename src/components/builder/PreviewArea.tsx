"use client";
import { useState } from "react";

export default function PreviewArea() {
  const [title, setTitle] = useState("www.mysite.com");
  const [logo, setLogo] = useState("https://dummyimage.com/20x20/fff/000.png&text=L");

  return (
    <>
      <div className="toolbar">
        <div className="devices">
          <span>DESKTOP • 100%</span>
          <span className="device-icons">🖥️ 📱</span>
        </div>
        <span className="step-info">STEP 2 OF 3 • Branding</span>
      </div>

      <div className="browser">
        <div className="browser-bar">
          <div className="browser-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="browser-url">
            {logo && <img src={logo} alt="Logo" />}
            <span className="title">{title}</span>
          </div>
        </div>
        <div className="browser-screen">
          <h1>Preview Screen</h1>
        </div>
        <div className="preview-footer">
          <button className="btn-primary">Full Preview</button>
        </div>
      </div>
    </>
  );
}
