import { headers } from "next/headers";

export default async function DashboardFormsPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;                   // ✅ await params
  const hdrs = await headers();                         // ✅ await headers
  const host = hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/forms/${websiteId}`, { cache: "no-store" });
  const data = await res.json().catch(() => []);
const json = await res.json().catch(() => ({}));
const messages = Array.isArray(json) ? json : json.messages ?? [];

return (
  <div className="p-6">
    <h2 className="text-2xl font-semibold mb-4">Form Submissions</h2>
    {messages.length === 0 ? (
      <p>No messages yet.</p>
    ) : (
      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border px-3 py-2 text-left">Name</th>
            <th className="border px-3 py-2 text-left">Email</th>
            <th className="border px-3 py-2 text-left">Message</th>
            <th className="border px-3 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((m: any) => (
            <tr key={m._id}>
              <td className="border px-3 py-2">{m.name}</td>
              <td className="border px-3 py-2">{m.email}</td>
              <td className="border px-3 py-2">{m.message}</td>
              <td className="border px-3 py-2">
                {new Date(m.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
}