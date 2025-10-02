"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BuilderPage() {
  const router = useRouter();
  const params = useParams<{ websiteId?: string }>();

  useEffect(() => {
    if (!params?.websiteId) {
      router.replace("/builder/templates");
    }
  }, [params?.websiteId, router]);

  const handleNext = () => {
    if (!params?.websiteId) {
      return;
    }

    router.push(`/builder/${params.websiteId}/checkout`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* existing Builder UI/UX: preview + sidebar for theme/content */}

      <div className="mt-6 flex justify-end">
        <button onClick={handleNext} className="rounded-lg bg-blue-600 px-6 py-3 text-white">
          Next → Checkout
        </button>
      </div>
    </div>
  );
}
