export async function updateWebsite(id: string, data: Record<string, unknown>) {
  await fetch(`/api/websites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
