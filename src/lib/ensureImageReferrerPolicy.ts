export function ensureImageReferrerPolicy(html: string, policy = "no-referrer") {
  if (!html) {
    return html;
  }

  return html.replace(/<img\b([^>]*?)>/gi, (match, attributes) => {
    if (/referrerpolicy\s*=\s*/i.test(attributes)) {
      return match;
    }

    const hasTrailingSlash = /\s*\/\s*$/.test(attributes);
    const cleanedAttributes = hasTrailingSlash
      ? attributes.replace(/\s*\/\s*$/, "")
      : attributes;

    const insertion = ` referrerpolicy="${policy}"`;
    if (hasTrailingSlash) {
      return `<img${cleanedAttributes}${insertion} />`;
    }

    return `<img${cleanedAttributes}${insertion}>`;
  });
}
