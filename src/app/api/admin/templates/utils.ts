export function createSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function sanitizeTemplatePayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    payload.name = body.name.trim();
  }

  const category = sanitizeOptionalString(body.category);
  if (category !== undefined) {
    payload.category = category;
  }

  const description = sanitizeOptionalString(body.description);
  if (description !== undefined) {
    payload.description = description ?? "";
  }

  const previewImage = sanitizeOptionalString(body.previewImage);
  if (previewImage !== undefined) {
    payload.previewImage = previewImage;
  }

  const previewVideo = sanitizeOptionalString(body.previewVideo);
  if (previewVideo !== undefined) {
    payload.previewVideo = previewVideo;
  }

  const previewImages = sanitizeStringArray(body.previewImages);
  if (previewImages !== undefined) {
    payload.previewImages = previewImages;
  }

  const features = sanitizeStringArray(body.features);
  if (features !== undefined) {
    payload.features = features;
  }

  const path = sanitizeOptionalString(body.path);
  if (path !== undefined) {
    payload.path = path;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive === "string") {
      payload.isActive = body.isActive === "true";
    } else {
      payload.isActive = Boolean(body.isActive);
    }
  }

  return payload;
}

function sanitizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const result = values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return result;
}
