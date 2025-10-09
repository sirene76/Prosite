"use client";

import { useCallback } from "react";

type AceEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  width?: string;
  height?: string;
  className?: string;
  readOnly?: boolean;
  mode?: string;
  theme?: string;
  placeholder?: string;
  setOptions?: Record<string, unknown>;
};

export default function AceEditor({
  value = "",
  onChange,
  width = "100%",
  height = "200px",
  className = "",
  readOnly = false,
  placeholder,
}: AceEditorProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event.target.value);
    },
    [onChange],
  );

  return (
    <textarea
      className={`w-full rounded-md border border-slate-800 bg-slate-950/50 p-3 font-mono text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-400/60 focus:ring-offset-0 ${className}`.trim()}
      style={{ width, height, resize: "vertical" }}
      value={value}
      onChange={handleChange}
      readOnly={readOnly}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}
