import assert from "node:assert/strict";
import { test } from "node:test";

import { buildDefaultContent } from "../builderDefaults";
import { ensureTemplateFieldIds, normaliseTemplateFields } from "../templateFieldUtils";

test("buildDefaultContent creates nested defaults from object field metadata", () => {
  const fieldConfig = {
    "hero.heading": { default: "Welcome" },
    "hero.cta": { default: "Start" },
    "footer.contact": { default: "Contact us" },
  };

  const fieldSource = ensureTemplateFieldIds(fieldConfig);
  const normalised = normaliseTemplateFields(fieldSource);
  const defaults = buildDefaultContent(normalised);

  assert.deepStrictEqual(defaults, {
    hero: {
      heading: "Welcome",
      cta: "Start",
    },
    footer: {
      contact: "Contact us",
    },
  });
});
