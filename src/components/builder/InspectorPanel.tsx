const tabs = ["Pages", "Theme", "Content"] as const;
const sections = [
  {
    id: "SITE",
    status: "SUCCESS",
    description: "Placeholder content for SITE section editing.",
  },
  {
    id: "HERO SECTION",
    status: "SUCCESS",
    description: "Placeholder content for HERO SECTION editing.",
  },
  {
    id: "FEATURES",
    status: "PENDING",
    description: "Add your feature highlights and supporting details.",
  },
];

export default function InspectorPanel() {
  return (
    <div className="flex h-full flex-col">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-white">Inspector</h2>
        <p className="text-sm text-gray-400">Branding</p>
      </header>

      <div className="mb-6 flex gap-3 border-b border-gray-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`text-sm font-medium transition-colors ${
              tab === "Content"
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400">SECTIONS</h3>
        <p className="mt-1 text-xs text-gray-500">
          Manage your content by opening each tag card and updating the fields.
        </p>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1">
        {sections.map((section) => (
          <article key={section.id} className="inspector-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{section.id}</span>
              <span
                className={`text-xs font-semibold ${
                  section.status === "SUCCESS" ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {section.status}
              </span>
            </div>
            <p className="text-xs text-gray-400">{section.description}</p>
          </article>
        ))}
      </div>

      <footer className="inspector-footer">Made with 💜 Prosite</footer>
    </div>
  );
}
