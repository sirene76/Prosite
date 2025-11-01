(function () {
  let originalHtml = document.body.innerHTML;

  function renderWithVariables(html, data) {
    return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const parts = key.split(".");
      let value = data;
      for (const p of parts) {
        value = value?.[p];
        if (value === undefined) return "";
      }
      return value;
    });
  }

  window.addEventListener("message", (event) => {
    const { type, payload } = event.data || {};
    if (type === "update-content") {
      document.body.innerHTML = renderWithVariables(originalHtml, payload);
    }

    if (type === "update-theme") {
      const colors = payload?.colors || {};
      Object.entries(colors).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
    }
  });
})();

;(function () {
  try {
    // If preview-script is actually loaded, tell parent.
    window.__PREVIEW_SCRIPT_LOADED__ = true;
    try {
      parent.postMessage({ type: "preview-script-loaded" }, "*");
    } catch (_) {}

    // Add a super-verbose listener that reports counts of replacements/vars.
    window.addEventListener(
      "message",
      function (event) {
        var data = event.data || {};
        if (!data.type) return;

        if (data.type === "update-content") {
          // No actual rendering here — only diagnostics.
          var sample = Object.keys(data.payload || {}).slice(0, 8);
          try {
            parent.postMessage({ type: "preview-script-seen-content", keys: sample }, "*");
          } catch (_) {}
        }

        if (data.type === "update-theme") {
          var c = data.payload && data.payload.colors ? Object.keys(data.payload.colors).length : 0;
          try {
            parent.postMessage({ type: "preview-script-seen-theme", cssVarCount: c }, "*");
          } catch (_) {}
        }
      },
      false,
    );
  } catch (e) {
    try {
      parent.postMessage({ type: "preview-script-error", error: String(e) }, "*");
    } catch (_) {}
  }
})();
