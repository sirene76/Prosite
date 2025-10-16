// Scroll + Live updates for Builder
window.addEventListener("message", (event) => {
  if (event.data?.type === "scrollToSection") {
    const section = document.getElementById(event.data.id);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.data?.type === "updateField") {
    const el = document.querySelector(`[data-field="${event.data.key}"]`);
    if (el) el.textContent = event.data.value;
  }
});

// Button pulse for fun
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector(".cta");
  if (btn) {
    btn.addEventListener("click", () => {
      btn.classList.add("pulse");
      setTimeout(() => btn.classList.remove("pulse"), 600);
    });
  }

  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 var(--accent); }
      70% { box-shadow: 0 0 0 20px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }
    .pulse { animation: pulse 0.6s ease; }
  `;
  document.head.appendChild(style);
});
