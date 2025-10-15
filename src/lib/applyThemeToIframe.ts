export function applyThemeToIframe(
  iframe: HTMLIFrameElement | null | undefined,
  colors: Record<string, string> | null | undefined,
): void {
  if (!iframe || !colors) {
    return;
  }

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    return;
  }

  const root = doc.documentElement;
  if (!root) {
    return;
  }

  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      const variableName = key.startsWith("--") ? key : `--${key}`;
      root.style.setProperty(variableName, value);
    }
  });
}
