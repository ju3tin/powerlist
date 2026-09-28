"use client";

import { useState } from "react";

export default function TestTicketPage() {
  const [name, setName] = useState("Jane Doe");
  const [tokenId, setTokenId] = useState("001");
  const [src, setSrc] = useState("/api/ticket?name=Jane%20Doe&id=001");

  const generate = () => {
    const url = `/api/testticket?name=${encodeURIComponent(name)}&id=${encodeURIComponent(tokenId)}&t=${Date.now()}`;
    setSrc(url);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8 gap-8">
      <h1 className="text-2xl font-bold">Ticket Image Preview</h1>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="flex-1 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700"
        />
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Token ID"
          className="w-28 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700"
        />
        <button
          onClick={generate}
          className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-medium"
        >
          Generate
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Ticket preview"
          width={600}
          height={840}
          className="block max-w-full h-auto"
        />
      </div>

      <p className="text-sm text-gray-500">
        Open directly:{" "}
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="underline text-blue-400"
        >
          {src}
        </a>
      </p>
    </main>
  );
}