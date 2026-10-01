"use client";

import { useEffect, useRef } from "react";
import { Sparkles, ArrowUpRight, ChevronRight, LockKeyhole, WalletCards, Check } from "lucide-react";

interface HeroSectionProps {
  verifiedProfile?: {
    title?: string;
  } | null;
  onClaimTicket?: () => void;
}

export default function HeroSection({ verifiedProfile, onClaimTicket }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force play on mobile
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        console.log("Video autoplay prevented:", err);
      }
    };

    playVideo();
  }, []);

  return (
    <section
      id="top"
      className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:px-10 lg:pb-32 lg:pt-20"
    >
      {/* ========== BACKGROUND VIDEO ========== */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-none">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/image.png" // fallback image
          className="h-full w-full object-cover"
        >
          <source src="/1001.mp4" type="video/mp4" />
          <source src="/videos/fintech-bg.webm" type="video/webm" />
        </video>

        {/* Overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70" />
        {/* Optional subtle blue tint */}
        <div className="absolute inset-0 bg-[#1e63f1]/5" />
      </div>

      {/* ========== LEFT CONTENT ========== */}
      <div className="relative z-10">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dbe5f4] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1e63f1]">
          <Sparkles className="size-3.5" /> Powerlist 2026
        </div>

        <h1 className="max-w-[680px] text-[clamp(3.6rem,7vw,6.8rem)] font-semibold leading-[.91] tracking-[-0.075em]">
          Your place in the <span className="text-[#1e63f1]">future</span> of finance.
        </h1>

        <p className="mt-8 max-w-[520px] text-lg leading-8 text-[#627487]">
          The Women in FinTech Powerlist 2026 is more than a list. Claim your digital ticket,
          celebrate your impact and join a global community shaping what comes next.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={onClaimTicket}
            className="group flex items-center gap-3 rounded-full bg-[#1e63f1] px-6 py-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(30,99,241,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1555d5]"
          >
            Claim your ticket
            <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-2 py-4 text-sm font-bold text-[#5f7183]"
          >
            See how it works <ChevronRight className="size-4" />
          </a>
        </div>

        <div className="mt-14 flex items-center gap-3 text-xs font-semibold text-[#8492a0]">
          <span className="grid size-8 place-items-center rounded-full border border-[#dfe5eb] bg-white">
            <LockKeyhole className="size-3.5" />
          </span>
          Secured by LinkedIn · Powered by Avalanche
        </div>
      </div>

      {/* ========== RIGHT TICKET CARD ========== */}
      <div className="relative min-h-[470px] lg:min-h-[590px]">
        <div className="absolute right-0 top-2 h-[86%] w-[88%] rounded-[2.5rem] bg-[#dce9ff]" />

        <div className="ticket-shadow absolute left-[8%] top-[14%] z-10 w-[82%] rotate-[5deg] overflow-hidden rounded-[1.75rem] bg-[#10253f] text-white transition-transform duration-500 hover:rotate-2">
          <div className="flex items-center justify-between border-b border-white/15 px-7 py-6">
            <span className="text-sm font-bold tracking-tight">innovate finance</span>
            <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#b8c6d4]">
              Digital ticket
            </span>
          </div>

          <div className="relative px-7 pb-8 pt-16">
            <div className="absolute -right-5 top-6 size-36 rounded-full border border-[#3a5d82]" />
            <div className="absolute -right-16 top-20 size-52 rounded-full border border-[#3a5d82]" />

            <p className="relative text-xs font-bold uppercase tracking-[.2em] text-[#91b7ff]">
              Women in FinTech
            </p>
            <h2 className="relative mt-3 max-w-[400px] text-5xl font-semibold leading-[.94] tracking-[-.06em]">
              Powerlist
              <br />
              2026
            </h2>

            <div className="mt-24 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[.16em] text-[#8ca0b4]">Issued to</p>
                <p className="mt-1 text-base font-semibold">
                  {verifiedProfile?.title ?? "Your name here"}
                </p>
              </div>
              <div className="grid size-16 place-items-center rounded-xl bg-white p-2">
                <div className="grid size-full place-items-center border-2 border-[#10253f] text-[8px] font-black text-[#10253f]">
                  QR
                  <br />
                  PASS
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/15 px-7 py-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#8ca0b4]">
            <span>Avalanche network</span>
            <span>1 of 1</span>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 z-20 flex items-center gap-3 rounded-2xl border border-[#dfe5eb] bg-white p-3 pr-5 shadow-[0_14px_30px_rgba(16,37,63,0.09)]">
          <span className="grid size-11 place-items-center rounded-xl bg-[#edf4ff] text-[#1e63f1]">
            <WalletCards className="size-5" />
          </span>
          <span>
            <span className="block text-xs font-bold text-[#10253f]">Ready for your wallet</span>
            <span className="block text-xs text-[#8492a0]">Works with Core & Gmail</span>
          </span>
          <Check className="ml-3 size-4 text-[#45c87a]" />
        </div>
      </div>
    </section>
  );
}