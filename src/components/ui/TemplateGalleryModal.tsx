"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { AnimatePresence, PanInfo, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X as CloseIcon } from "lucide-react/icons";

export type TemplateGalleryModalTemplate = {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  previewVideo?: string;
};

type TemplateGalleryModalProps = {
  open: boolean;
  index: number;
  templates: TemplateGalleryModalTemplate[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function TemplateGalleryModal({
  open,
  index,
  templates,
  onClose,
  onSelect,
  onPrev,
  onNext,
}: TemplateGalleryModalProps) {
  const template = templates[index];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, onNext, onPrev]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) {
      return;
    }

    if (open && template?.previewVideo) {
      node.currentTime = 0;
      node
        .play()
        .catch(() => {
          /* ignore autoplay failures */
        });
      return () => {
        node.pause();
      };
    }

    node.pause();
  }, [open, template?.previewVideo, index]);

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const swipe = Math.abs(offset) > 100 && Math.abs(velocity) > 200;
    if (!swipe) {
      return;
    }

    if (offset > 0) {
      onPrev();
    } else {
      onNext();
    }
  };

  return (
    <AnimatePresence>
      {open && template ? (
        <motion.div
          key={template.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6"
          onClick={onClose}
          aria-modal
          role="dialog"
        >
          <motion.div
            layout
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/95"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
              aria-label="Close preview"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            {templates.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                  aria-label="View previous template"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                  aria-label="View next template"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}

            <div className="relative h-[65vh] w-full bg-black">
              {template.previewVideo ? (
                <video
                  ref={videoRef}
                  key={template.previewVideo}
                  src={template.previewVideo}
                  muted
                  playsInline
                  poster={template.previewImage}
                  className="h-full w-full object-cover"
                  controls={false}
                />
              ) : (
                <Image
                  src={template.previewImage}
                  alt={template.name}
                  fill
                  sizes="(min-width: 1024px) 896px, 100vw"
                  className="object-cover"
                  priority={false}
                />
              )}
            </div>

            <div className="space-y-3 p-6 text-center">
              <h2 className="text-xl font-semibold text-white">{template.name}</h2>
              <p className="text-slate-300">{template.description}</p>
              <button
                type="button"
                onClick={() => onSelect(template.id)}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-500"
              >
                Use this template →
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
