"use client";

type TicketPreviewProps = {
  src: string;
  name?: string;
  title?: string;
  label?: string;
};

export default function TicketPreview({
  src,
  name = "Ticket",
  title = "Ticket Preview",
  label,
}: TicketPreviewProps) {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        {label && (
          <span className="rounded-full border px-3 py-1 text-xs font-semibold">
            {label}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-black shadow-lg">
        <img
          src={src}
          alt={`${name} ticket`}
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}