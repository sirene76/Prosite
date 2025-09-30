export function renderTemplate(html: string, data: Record<string, string>) {
  return html.replace(/{{(.*?)}}/g, (_, key: string) => data[key.trim()] ?? "");
}
