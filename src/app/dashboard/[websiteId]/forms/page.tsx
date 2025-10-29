import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { headers, cookies } from "next/headers";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

function formatDate(value: unknown) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function serializeMessages(input: unknown): Array<{
  _id?: string;
  name?: string;
  email?: string;
  message?: string;
  createdAt?: string;
}> {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item) => {
    if (typeof item !== "object" || item === null) {
      return {};
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : undefined;
    const email = typeof record.email === "string" ? record.email.trim() : undefined;
    const messageText =
      typeof record.message === "string" ? record.message.trim() : undefined;

    return {
      _id: record._id ? String(record._id) : undefined,
      name: name && name.length > 0 ? name : undefined,
      email: email && email.length > 0 ? email : undefined,
      message: messageText && messageText.length > 0 ? messageText : undefined,
      createdAt:
        typeof record.createdAt === "string"
          ? record.createdAt
          : record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : undefined,
    };
  });
}

function toCookieHeader(): string | undefined {
  const cookieStore = cookies();
  const values = cookieStore.getAll();
  if (!values.length) {
    return undefined;
  }

  return values.map((entry) => `${entry.name}=${entry.value}`).join("; ");
}

export default async function DashboardFormsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const { websiteId } = await params;
  if (!websiteId || !isValidObjectId(websiteId)) {
    notFound();
  }

  await connectDB();
  const website = await Website.findById(websiteId).lean();
  if (!website) {
    notFound();
  }

  const sessionWithId = session as typeof session & { userId?: string };
  if (
    (website.user && website.user !== session.user.email) ||
    (website.userId && sessionWithId.userId && String(website.userId) !== sessionWithId.userId)
  ) {
    notFound();
  }

  const headersList = headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl =
    host
      ? `${protocol}://${host}`
      : process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("Unable to determine application base URL");
  }

  const cookieHeader = toCookieHeader();
  const response = await fetch(`${baseUrl}/api/forms/${websiteId}`, {
    headers: cookieHeader
      ? {
          Cookie: cookieHeader,
        }
      : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load messages (${response.status})`);
  }

  const data = (await response.json()) as { messages?: unknown };
  const messages = serializeMessages(data.messages);

  return (
    <div className="max-w-5xl px-6 py-10 mx-auto">
      <div className="mb-8">
        <a
          href={`/dashboard/${websiteId}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          ← Back to overview
        </a>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Contact form inbox</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review form submissions from your live site.
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No messages yet. Share your form to start collecting leads.
                  </td>
                </tr>
              ) : (
                messages.map((message, index) => (
                  <tr key={message._id ?? `message-${index}`}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {message.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                      {message.email ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {message.message ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                      {formatDate(message.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
