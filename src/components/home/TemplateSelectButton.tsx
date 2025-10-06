"use client";

import { useState, type ReactNode } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface TemplateSelectButtonProps {
  templateId: string;
  className?: string;
  children?: ReactNode;
}

export function TemplateSelectButton({
  templateId,
  className,
  children,
}: TemplateSelectButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    if (!session) {
      await signIn(undefined, {
        callbackUrl: `/templates?selected=${encodeURIComponent(templateId)}`,
      });
      return;
    }

    setIsLoading(true);
    router.push(`/templates/${templateId}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? "Opening template..." : children}
    </button>
  );
}
