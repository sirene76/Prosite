function resolveBaseUrl() {
  return (
    process.env.CRON_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

async function triggerCronEndpoint(path: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("Missing CRON_SECRET environment variable");
  }

  const baseUrl = resolveBaseUrl();
  const url = new URL(path, baseUrl);
  url.searchParams.set("secret", secret);

  const response = await fetch(url.toString(), { method: "POST" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Cron job request to ${url.pathname} failed with ${response.status}: ${message}`
    );
  }

  return response.json().catch(() => ({}));
}

export async function runNightlyJobs() {
  const endpoints = ["/api/cron/seo-scan", "/api/cron/stripe-sync"];

  const results = [];
  for (const endpoint of endpoints) {
    results.push(await triggerCronEndpoint(endpoint));
  }

  return results;
}
