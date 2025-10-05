"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";
import clsx from "clsx";

export type TemplateCardTemplate = {
  id: string;
  name: string;
  description: string;
  preview?: string;
  previewImage?: string;
  previewVideo?: string;
  video?: string;
};

type TemplateCardProps = {
  template: TemplateCardTemplate;
  className?: string;
  onPreview?: (templateId: string) => void;
};

export function TemplateCard({ template, className, onPreview }: TemplateCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const previewSrc = template.preview ?? template.previewImage;
  const videoSrc = template.video ?? template.previewVideo;

  useEffect(() => {
    const node = videoRef.current;

    if (!node || !videoSrc) {
      return;
    }

    if (isHovering) {
      const play = async () => {
        try {
          await node.play();
        } catch (error) {
          console.warn("Unable to autoplay preview video", error);
        }
      };

      void play();
      return;
    }

    node.pause();
    try {
      node.currentTime = 0;
    } catch {
      // ignore seeking issues
    }
  }, [isHovering, videoSrc]);

  return (
    <>
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => {
          if (onPreview) {
            onPreview(template.id);
          }
        }}
        className={clsx(
          "group relative flex h-64 w-full cursor-pointer overflow-hidden rounded-3xl bg-gray-950/40 transition",
          className
        )}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            poster={previewSrc}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        ) : previewSrc ? (
          <Image
            src={previewSrc}
            alt={template.name}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 768px) 300px, 100vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-950 text-xs uppercase tracking-[0.3em] text-slate-500">
            No Preview
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {videoSrc ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPreview?.(template.id);
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-label={`Preview ${template.name}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : null}

        <div className="absolute bottom-0 left-0 w-full bg-black/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">{template.name}</h3>
        </div>
      </div>
    </>
  );
}
