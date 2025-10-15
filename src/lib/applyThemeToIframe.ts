const TRANSITION_CLASS = "theme-fade";
const TRANSITION_STYLE_ID = "theme-fade-style";
const TRANSITION_DURATION_MS = 450;

export type ThemeTokens = {
  colors?: Record<string, string> | null;
  fonts?: Record<string, string> | null;
};

const fadeTimeouts = new WeakMap<Document, number>();

export function applyThemeToIframe(doc: Document | null, theme: ThemeTokens | null) {
  if (!doc || !theme) {
    return;
  }

  const root = doc.documentElement;
  if (!root) {
    return;
  }

  ensureTransitionStyle(doc);
  toggleTransitionClass(doc, true);

  const colors = theme.colors ?? {};
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === "string") {
      root.style.setProperty(`--${key}`, value);
    }
  });

  const fonts = theme.fonts ?? {};
  Object.entries(fonts).forEach(([key, value]) => {
    if (typeof value === "string") {
      root.style.setProperty(`--font-${key}`, value);
    }
  });

  scheduleTransitionCleanup(doc);
}

function ensureTransitionStyle(doc: Document) {
  if (doc.getElementById(TRANSITION_STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = TRANSITION_STYLE_ID;
  const durationSeconds = `${TRANSITION_DURATION_MS / 1000}s`;
  style.textContent = `
.${TRANSITION_CLASS},
.${TRANSITION_CLASS} *,
.${TRANSITION_CLASS} *::before,
.${TRANSITION_CLASS} *::after {
  transition-property: background-color, color, border-color, fill, stroke;
  transition-duration: ${durationSeconds};
  transition-timing-function: ease;
}
`;

  doc.head?.appendChild(style);
}

function toggleTransitionClass(doc: Document, add: boolean) {
  const root = doc.documentElement;
  const body = doc.body;

  if (add) {
    root.classList.add(TRANSITION_CLASS);
    body?.classList.add(TRANSITION_CLASS);
    return;
  }

  root.classList.remove(TRANSITION_CLASS);
  body?.classList.remove(TRANSITION_CLASS);
}

function scheduleTransitionCleanup(doc: Document) {
  const win = doc.defaultView;
  if (!win) {
    toggleTransitionClass(doc, false);
    return;
  }

  const existingTimeout = fadeTimeouts.get(doc);
  if (typeof existingTimeout === "number") {
    win.clearTimeout(existingTimeout);
  }

  const timeoutId = win.setTimeout(() => {
    toggleTransitionClass(doc, false);
    fadeTimeouts.delete(doc);
  }, TRANSITION_DURATION_MS);

  fadeTimeouts.set(doc, Number(timeoutId));
}
