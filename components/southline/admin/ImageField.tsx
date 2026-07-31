"use client";

import { useRef, useState } from "react";

export default function ImageField({
  label,
  value,
  onChange,
  pin,
  kind,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  pin: string;
  kind: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/southline/upload", {
        method: "POST",
        headers: { "x-snaplink-pin": pin },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-28 rounded-lg border border-white/10 object-cover"
          />
          <button type="button" onClick={() => onChange("")} className="text-xs text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2">
            Remove
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          className="text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:text-gold"
        />
        {busy && <span className="text-xs text-muted">Uploading…</span>}
      </div>
      <input
        className="input"
        placeholder="…or paste an image URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
