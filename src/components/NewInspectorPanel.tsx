"use client";
import { useState } from "react";

export default function NewInspectorPanel({ data, setData }: any) {
  const [activeTab, setActiveTab] = useState("content");
  const [openField, setOpenField] = useState<string | null>("Website Title");

  return (
    <>
      <h2>Inspector</h2>
      <p className="subtitle">Branding</p>

      <div className="tabs">
        {["pages", "theme", "content"].map((t) => (
          <button
            key={t}
            className={`tab ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="tab-content active">
          <h3>Sections</h3>
          <p className="desc">
            Manage your content by opening each field and updating it below.
          </p>

          {["Website Title", "Business Name", "Upload Logo"].map((label) => (
            <div className="collapsible" key={label}>
              <button
                className={`collapse-toggle ${
                  openField === label ? "open" : ""
                }`}
                onClick={() =>
                  setOpenField(openField === label ? null : label)
                }
              >
                {label}
              </button>
              {openField === label && (
                <div className="collapse-content">
                  {label === "Upload Logo" ? (
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (r) =>
                          setData({ ...data, logo: r.target?.result });
                        reader.readAsDataURL(file);
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input-field"
                      value={
                        label === "Website Title" ? data.title : data.business
                      }
                      onChange={(e) =>
                        setData({
                          ...data,
                          [label === "Website Title"
                            ? "title"
                            : "business"]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <footer className="footer">Made with 💜 Prosite</footer>
    </>
  );
}
