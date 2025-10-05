"use client";

import { useEffect, useState } from "react";

import { WebsiteCard } from "@/components/dashboard/WebsiteCard";
import type { DashboardWebsite } from "@/types/website";

export default function DashboardPage() {
  const [websites, setWebsites] = useState<DashboardWebsite[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/websites")
      .then((res) => (res.ok ? res.json() : Promise.resolve({ websites: [] })))
      .then((data: { websites?: DashboardWebsite[] }) => {
        if (!isMounted) return;
        setWebsites(Array.isArray(data.websites) ? data.websites : []);
      })
      .catch((error) => {
        console.error("Failed to load websites", error);
        if (!isMounted) return;
        setWebsites([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleted = (id: string) => {
    setWebsites((prev) => prev.filter((w) => w._id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Websites</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {websites.map((w) => (
          <WebsiteCard key={w._id} website={w} onDeleted={handleDeleted} />
        ))}
      </div>

      {websites.length === 0 && (
        <p className="text-gray-500 mt-6">No websites yet.</p>
      )}
    </div>
  );
}
