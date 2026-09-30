import { Suspense } from "react";
import TicketPreviewClient from "./TicketPreviewClient";

export const metadata = {
  title: "Ticket Preview | Women in FinTech Powerlist",
  description: "Digital ticket preview",
};

export default function TicketPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Digital Ticket</h1>
        <p className="text-[#7eb0ff] text-sm mt-1">
          Women in FinTech Powerlist
        </p>
      </div>

      <Suspense
        fallback={
          <div className="text-gray-400 text-sm animate-pulse">
            Loading ticket…
          </div>
        }
      >
        <TicketPreviewClient />
      </Suspense>
    </div>
  );
}