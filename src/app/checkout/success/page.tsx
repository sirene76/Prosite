"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const websiteId = searchParams.get("websiteId");

  useEffect(() => {
    const destination = websiteId ? `/dashboard/${websiteId}` : "/dashboard";
    const timer = setTimeout(() => {
      router.push(destination);
    }, 2500);
    return () => clearTimeout(timer);
  }, [router, websiteId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-green-600">✅ Payment Successful</h1>
      <p className="mt-4">
        {websiteId
          ? "Redirecting you to your website dashboard..."
          : "We couldn't find your website. Redirecting you to your dashboard..."}
      </p>

    </div>
  );
}
