"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface TemplateSelectButtonProps {
  templateId: string;
  className?: string;
  children?: ReactNode;
}

interface CreateWebsiteResponse {
  _id: string;
}

export function TemplateSelectButton({
  templateId,
  className,
  children,
}: TemplateSelectButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create website (status ${response.status})`);
      }

      const website: CreateWebsiteResponse = await response.json();

      if (!website?._id) {
        throw new Error("Website response did not include an _id");
      }

      router.replace(`/builder/${website._id}/theme`);
    } catch (error) {
      console.error("Failed to create website", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? "Creating website..." : children}
    </button>
  );
}
