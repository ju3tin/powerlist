"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import AdminNav from "@/components/nav";

export default function UploadPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/profiles/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setStatus(`Success! Upserted: ${data.upserted}, Modified: ${data.modified}, Total: ${data.total}`);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    multiple: false,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/profiles" className="font-semibold text-lg">Profile Manager</Link>
          <Link href="/profiles" className="text-sm text-gray-600 hover:text-blue-600">Profiles</Link>
          <Link href="/upload" className="text-sm text-blue-600 font-medium">Upload JSON</Link>
        </div>
        <button
          onClick={() => {
            document.cookie = "admin_token=; path=/; max-age=0";
            window.location.href = "/login";
          }}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </nav> */}
      <AdminNav />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">JSON Profile Uploader</h1>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the JSON file here…</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Drag & drop a profiles.json file, or click to select</p>
              <p className="text-sm text-gray-400">Accepts a JSON array of profile objects</p>
            </div>
          )}
        </div>

        {loading && <p className="mt-4 text-blue-600 font-medium">Uploading…</p>}
        {status && (
          <p className={`mt-4 font-medium ${status.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
