export function injectThemeTokens({
  html,
  css,
  colors = {},
  fonts = {},
}: {
  html: string;
  css?: string;
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
}) {
  // Convert color map to CSS variables
  const colorVars = Object.entries(colors)
    .map(([key, value]) => `--${key}: ${value};`)
    .join("\n");

  // Convert font map to CSS variables
  const fontVars = Object.entries(fonts)
    .map(([key, value]) => `--font-${key}: ${value};`)
    .join("\n");

  const variablesBlock = `:root {
  transition: all 0.3s ease;
  ${colorVars}
  ${fontVars}
}`;

  // Build full HTML document
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      ${variablesBlock}
      ${css ?? ""}
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>
`;
}
