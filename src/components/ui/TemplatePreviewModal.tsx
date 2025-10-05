"use client";

import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";

import Image from "next/image";
import clsx from "clsx";

type TemplatePreview = {
  name: string;
  description: string;
  video?: string;
  preview?: string;
};

type TemplatePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  template?: TemplatePreview;
  onUseTemplate?: () => void;
};

export function TemplatePreviewModal({
  open,
  onClose,
  template,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.dataset.templatePreviewModal = "open";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
        delete document.body.dataset.templatePreviewModal;
      };
    }

    document.body.style.overflow = "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const hasContent = Boolean(open && template);
  const videoSrc = template?.video;
  const previewSrc = template?.preview;

  return (
    <Transition show={hasContent} as={Fragment} appear>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => {
          onClose();
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-800/70 bg-gray-900/95 text-left shadow-xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-2 py-1 text-sm font-medium text-white transition hover:bg-black/80"
                >
                  ✕
                </button>

                <div className="relative h-[60vh] w-full bg-black">
                  {videoSrc ? (
                    <video
                      key={videoSrc}
                      src={videoSrc}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      controlsList="nodownload noplaybackrate"
                      className="h-full w-full object-cover"
                      poster={previewSrc}
                    />
                  ) : previewSrc ? (
                    <Image
                      src={previewSrc}
                      alt={template?.name ?? "Template preview"}
                      fill
                      sizes="(min-width: 1280px) 768px, 100vw"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-950 text-sm text-gray-400">
                      Preview unavailable
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-6">
                  <Dialog.Title className="text-2xl font-semibold text-white">
                    {template?.name}
                  </Dialog.Title>
                  <p className="text-sm leading-relaxed text-gray-300">{template?.description}</p>

                  {onUseTemplate ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUseTemplate();
                        }}
                        className={clsx(
                          "inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition",
                          "hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                        )}
                      >
                        Use this template
                      </button>
                    </div>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
