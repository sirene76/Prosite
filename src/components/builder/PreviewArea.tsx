export default function PreviewArea() {
  return (
    <section className="flex flex-col">
      <div className="preview-wrapper">
        <div className="browser-bar">
          <div className="browser-dots">
            <span className="dot-red" />
            <span className="dot-yellow" />
            <span className="dot-green" />
          </div>
          <div className="flex-1 text-center text-xs uppercase tracking-[0.2em] text-gray-400">
            www.title.com ✕
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>75%</span>
            <div className="flex gap-1">
              <button type="button" className="btn-secondary px-2 py-1">-</button>
              <button type="button" className="btn-secondary px-2 py-1">+</button>
            </div>
          </div>
        </div>
        <div className="preview-screen">Preview Screen</div>
      </div>

      <div className="preview-actions">
        <button type="button" className="btn-secondary">
          Full Preview
        </button>
        <button type="button" className="btn-primary">
          Export
        </button>
      </div>
    </section>
  );
}
