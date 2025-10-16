// ✅ Scroll handler for Builder preview
window.addEventListener("message", (e) => {
  if (e.data?.type === "scrollToSection") {
    const section = document.getElementById(e.data.id);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ✅ Live content updates (when editing text fields)
  if (e.data?.type === "updateField") {
    const el = document.querySelector(`[data-field="${e.data.key}"]`);
    if (el) el.textContent = e.data.value;
  }
});

// Simple click test
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hero-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      alert("🚀 Nova Studio ready!");
    });
  }
});
