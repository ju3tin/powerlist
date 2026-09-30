"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function TicketPreviewClient() {
  const sp = useSearchParams();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    const keys = [
      "name",
      "tokenId",
      "imageUrl",
      "role",
      "category",
      "year",
      "companyLogo",
      "linkedinUrl",
    ] as const;

    for (const key of keys) {
      const val = sp.get(key);
      if (val && val.trim() && val !== "false") {
        params.set(key, val.trim());
      }
    }
    return params.toString();
  }, [sp]);

  useEffect(() => {
    let revoked: string | null = null;
    setLoading(true);
    setError(null);
    setObjectUrl(null);

    (async () => {
      try {
        const res = await fetch(`/api/preview-ticket?${queryString}`);
        const type = res.headers.get("content-type") || "";

        if (!res.ok || type.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoked = url;
        setObjectUrl(url);
      } catch (e: any) {
        setError(e?.message || "Could not generate ticket");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [queryString]);

  const name = sp.get("name")?.trim() || "Guest";
  const role = sp.get("role")?.trim();
  const tokenId = sp.get("tokenId")?.trim();
  const category = sp.get("category")?.trim();

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
      <div className="bg-[#162d4a] rounded-2xl p-3 shadow-2xl w-full flex justify-center min-h-[200px] items-center">
        {loading && (
          <p className="text-gray-400 text-sm py-12">Generating ticket…</p>
        )}
        {error && (
          <div className="text-red-400 text-sm py-8 px-4 text-center break-words max-w-md">
            {error}
          </div>
        )}
        {!loading && !error && objectUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt={`Ticket for ${name}`}
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: "75vh" }}
          />
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="font-semibold text-lg">{name}</p>
        {role && <p className="text-gray-400 text-sm">{role}</p>}
        {category && (
          <p className="text-[#7eb0ff] text-xs uppercase tracking-wider">
            {category}
          </p>
        )}
        {tokenId && (
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            #{tokenId}
          </p>
        )}
      </div>

      {objectUrl && (
        <a
          href={objectUrl}
          download={`ticket-${tokenId || "preview"}.png`}
          className="text-sm text-[#5b9aff] hover:underline"
        >
          Download PNG →
        </a>
      )}
    </div>
  );
}