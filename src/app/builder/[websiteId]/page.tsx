"use client";

import { useRouter, useParams } from "next/navigation";

export default function BuilderPage() {
  const router = useRouter();
  const params = useParams<{ websiteId: string }>();

  const handleNext = () => {
    router.push(`/checkout/${params.websiteId}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* existing builder UI */}

      <div className="mt-6 flex justify-end">
        <button onClick={handleNext} className="rounded-lg bg-blue-600 px-6 py-3 text-white">
          Next → Checkout
        </button>
      </div>
    </div>
  );
}
