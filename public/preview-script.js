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
