export type ThemeConfig = {
  colors?: Record<string, unknown> | null;
  fonts?: Record<string, unknown> | null;
};

function toVariableLines(prefix: string, tokens: Record<string, unknown> = {}) {
  return Object.entries(tokens)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => {
      const trimmed = (value as string).trim();
      const normalisedKey = key.replace(/[^a-zA-Z0-9-_]/g, "-");
      return `  --${prefix}${normalisedKey}: ${trimmed};`;
    });
}

export function injectThemeTokens(
  css: string | null | undefined,
  theme: ThemeConfig | null | undefined
) {
  const colors = (theme?.colors ?? {}) as Record<string, unknown>;
  const fonts = (theme?.fonts ?? {}) as Record<string, unknown>;

  const colorLines = toVariableLines("", colors);
  const fontLines = toVariableLines("font-", fonts);

  const variablesBlock = [...colorLines, ...fontLines];

  const output: string[] = [];
  if (variablesBlock.length > 0) {
    output.push([":root {", ...variablesBlock, "}"].join("\n"));
  }

  if (typeof css === "string" && css.trim().length > 0) {
    output.push(css.trim());
  }

  return output.join("\n\n");
}
