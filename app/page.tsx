'use client'

import { FormEvent, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  BriefcaseBusiness,
  LockKeyhole,
  Menu,
  Sparkles,
  Ticket,
  WalletCards,
  X,
} from 'lucide-react'

const steps = [
  { number: '01', title: 'Verify your profile', text: 'Sign in securely with LinkedIn to confirm your place in the community.' },
  { number: '02', title: 'Create your ticket', text: 'Your unique Powerlist 2026 ticket is minted on Avalanche.' },
  { number: '03', title: 'Keep it forever', text: 'Add your ticket to Core Wallet and bring it with you to the celebration.' },
]

export default function Page() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'eligible' | 'not-found' | 'error'>('idle')
  const [verifiedProfile, setVerifiedProfile] = useState<{ title: string; artist_title?: string; featured_image?: string } | null>(null)
  const [badgeClaimed, setBadgeClaimed] = useState(false)

  function copyAddress() {
    navigator.clipboard?.writeText('0x4f8A...91c2')
    setIsCopied(true)
    window.setTimeout(() => setIsCopied(false), 1800)
  }

  async function verifyProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setVerificationState('loading')
    try {
      const response = await fetch(`/api/powerlist?linkedin=${encodeURIComponent(linkedinUrl)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setVerifiedProfile(result.profile)
      setBadgeClaimed(false)
      setVerificationState(result.eligible ? 'eligible' : 'not-found')
      if (result.eligible) {
        setIsConnected(true)
        setBadgeClaimed(true)
      }
    } catch {
      setVerificationState('error')
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fa] text-[#10253f]">
      <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 lg:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="Innovate Finance home">
          <span className="grid size-9 place-items-center rounded-full bg-[#10253f] text-sm font-bold text-white">IF</span>
          <span className="text-sm font-bold tracking-[-0.02em]">innovate finance</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#5f7183] md:flex" aria-label="Main navigation">
          <a href="#about" className="transition-colors hover:text-[#10253f]">About the Powerlist</a>
          <a href="#how-it-works" className="transition-colors hover:text-[#10253f]">How it works</a>
          <a href="#faq" className="transition-colors hover:text-[#10253f]">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <button onClick={copyAddress} className="hidden items-center gap-2 rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 text-sm font-semibold shadow-sm md:flex" aria-label="Copy wallet address">
              <span className="size-2 rounded-full bg-[#45c87a]" /> {isCopied ? 'Copied' : '0x4f8A...91c2'}
              {isCopied ? <Check className="size-4 text-[#45c87a]" /> : <Copy className="size-4 text-[#8a9bab]" />}
            </button>
          ) : (
            <button onClick={() => setIsSignInOpen(true)} className="hidden rounded-full bg-[#1e63f1] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(30,99,241,0.2)] transition hover:bg-[#1555d5] md:block">Sign in with LinkedIn</button>
          )}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-full border border-[#dfe5eb] bg-white p-2.5 md:hidden" aria-label="Toggle menu">
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {isMenuOpen && <div className="absolute right-6 top-20 z-30 flex w-64 flex-col gap-4 rounded-2xl border border-[#dfe5eb] bg-white p-5 text-sm font-semibold shadow-xl md:hidden"><a href="#about" onClick={() => setIsMenuOpen(false)}>About the Powerlist</a><a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it works</a><a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a><button onClick={() => { setIsMenuOpen(false); setIsSignInOpen(true) }} className="rounded-full bg-[#1e63f1] px-4 py-3 text-white">Sign in with LinkedIn</button></div>}

      <section id="top" className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.03fr_.97fr] lg:px-10 lg:pb-32 lg:pt-20">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dbe5f4] bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1e63f1]"><Sparkles className="size-3.5" /> Powerlist 2026</div>
          <h1 className="max-w-[680px] text-[clamp(3.6rem,7vw,6.8rem)] font-semibold leading-[.91] tracking-[-0.075em]">Your place in the <span className="text-[#1e63f1]">future</span> of finance.</h1>
          <p className="mt-8 max-w-[520px] text-lg leading-8 text-[#627487]">The Women in FinTech Powerlist 2026 is more than a list. Claim your digital ticket, celebrate your impact and join a global community shaping what comes next.</p>
          <div className="mt-10 flex flex-wrap items-center gap-4"><button onClick={() => setIsSignInOpen(true)} className="group flex items-center gap-3 rounded-full bg-[#1e63f1] px-6 py-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(30,99,241,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1555d5]">Claim your ticket <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button><a href="#how-it-works" className="flex items-center gap-2 px-2 py-4 text-sm font-bold text-[#5f7183]">See how it works <ChevronRight className="size-4" /></a></div>
          <div className="mt-14 flex items-center gap-3 text-xs font-semibold text-[#8492a0]"><span className="grid size-8 place-items-center rounded-full border border-[#dfe5eb] bg-white"><LockKeyhole className="size-3.5" /></span> Secured by LinkedIn · Powered by Avalanche</div>
        </div>

        <div className="relative min-h-[470px] lg:min-h-[590px]">
          <div className="absolute right-0 top-2 h-[86%] w-[88%] rounded-[2.5rem] bg-[#dce9ff]" />
          <div className="ticket-shadow absolute left-[8%] top-[14%] z-10 w-[82%] rotate-[5deg] overflow-hidden rounded-[1.75rem] bg-[#10253f] text-white transition-transform duration-500 hover:rotate-2">
            <div className="flex items-center justify-between border-b border-white/15 px-7 py-6"><span className="text-sm font-bold tracking-tight">innovate finance</span><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-[#b8c6d4]">Digital ticket</span></div>
            <div className="relative px-7 pb-8 pt-16"><div className="absolute -right-5 top-6 size-36 rounded-full border border-[#3a5d82]" /><div className="absolute -right-16 top-20 size-52 rounded-full border border-[#3a5d82]" /><p className="relative text-xs font-bold uppercase tracking-[.2em] text-[#91b7ff]">Women in FinTech</p><h2 className="relative mt-3 max-w-[400px] text-5xl font-semibold leading-[.94] tracking-[-.06em]">Powerlist<br />2026</h2><div className="mt-24 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.16em] text-[#8ca0b4]">Issued to</p><p className="mt-1 text-base font-semibold">{verifiedProfile?.title ?? 'Your name here'}</p></div><div className="grid size-16 place-items-center rounded-xl bg-white p-2"><div className="grid size-full place-items-center border-2 border-[#10253f] text-[8px] font-black text-[#10253f]">QR<br />PASS</div></div></div></div>
            <div className="flex items-center justify-between border-t border-white/15 px-7 py-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#8ca0b4]"><span>Avalanche network</span><span>1 of 1</span></div>
          </div>
          <div className="absolute bottom-4 left-0 z-20 flex items-center gap-3 rounded-2xl border border-[#dfe5eb] bg-white p-3 pr-5 shadow-[0_14px_30px_rgba(16,37,63,0.09)]"><span className="grid size-11 place-items-center rounded-xl bg-[#edf4ff] text-[#1e63f1]"><WalletCards className="size-5" /></span><span><span className="block text-xs font-bold text-[#10253f]">Ready for your wallet</span><span className="block text-xs text-[#8492a0]">Works with Core & Gmail</span></span><Check className="ml-3 size-4 text-[#45c87a]" /></div>
        </div>
      </section>

      <section id="about" className="border-y border-[#e4e9ee] bg-white"><div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#1e63f1]">A new kind of recognition</p><h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-[-.05em]">One ticket.<br />A lasting signal.</h2></div><div className="grid gap-6 sm:grid-cols-3">{steps.map((step) => <article key={step.number} className="border-t-2 border-[#dce9ff] pt-5"><p className="text-sm font-bold text-[#1e63f1]">{step.number}</p><h3 className="mt-8 text-base font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[#718294]">{step.text}</p></article>)}</div></div></section>

      <section id="how-it-works" className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#1e63f1]">Built for the community</p><h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-.05em]">Your identity stays yours. Your ticket goes everywhere.</h2></div><div className="flex max-w-md items-center gap-4 rounded-2xl border border-[#dfe5eb] bg-white p-5"><BriefcaseBusiness className="size-7 text-[#0a66c2]" /><p className="text-sm leading-6 text-[#627487]">We use your LinkedIn profile only to verify your place in the Powerlist community.</p></div></section>

      <footer id="faq" className="border-t border-[#e4e9ee] bg-[#10253f] text-white"><div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10"><div><p className="font-bold">innovate finance</p><p className="mt-2 text-sm text-[#9baebe]">Women in FinTech Powerlist 2026</p></div><div className="flex gap-6 text-sm text-[#b7c4d0]"><a href="#about" className="hover:text-white">About</a><a href="#how-it-works" className="hover:text-white">How it works</a><a href="#faq" className="hover:text-white">Privacy</a></div></div></footer>

      {badgeClaimed && verifiedProfile && <section className="fixed bottom-6 right-6 z-40 w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-3xl border border-[#dfe5eb] bg-white shadow-2xl" aria-label="Your Powerlist badge"><div className="h-2 bg-[#1e63f1]" /><div className="flex gap-4 p-5"><img src={verifiedProfile.featured_image || '/placeholder.jpg'} alt="" className="size-20 rounded-2xl object-cover" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1e63f1]">Badge created</p><h2 className="mt-1 truncate text-lg font-bold text-[#10253f]">{verifiedProfile.title}</h2><p className="mt-1 text-xs text-[#718294]">Women in FinTech Powerlist 2026</p><p className="mt-3 inline-flex rounded-full bg-[#effcf4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#176b3a]">Avalanche · 1 of 1</p></div></div></section>}

      {isSignInOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#10253f]/45 p-6 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="signin-title" className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><button onClick={() => setIsSignInOpen(false)} className="absolute right-5 top-5 rounded-full p-2 text-[#8a9bab] hover:bg-[#f2f5f8]" aria-label="Close sign in dialog"><X className="size-5" /></button><div className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ff] text-[#0a66c2]"><BriefcaseBusiness className="size-7" /></div><h2 id="signin-title" className="mt-7 text-3xl font-semibold tracking-[-.05em]">Verify your place.</h2><p className="mt-3 text-sm leading-6 text-[#718294]">Use the LinkedIn URL connected to your Powerlist profile. The live Innovate Finance directory checks eligibility.</p><form onSubmit={verifyProfile} className="mt-7"><label htmlFor="linkedin-url" className="text-xs font-bold uppercase tracking-[.14em] text-[#5f7183]">LinkedIn profile URL</label><input id="linkedin-url" value={linkedinUrl} onChange={(event) => { setLinkedinUrl(event.target.value); setVerificationState('idle') }} placeholder="https://www.linkedin.com/in/your-name" className="mt-2 w-full rounded-2xl border border-[#dfe5eb] px-4 py-3 text-sm text-[#10253f] outline-none ring-[#1e63f1] focus:ring-2" required /><button type="submit" disabled={verificationState === 'loading'} className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-[#0a66c2] px-5 py-4 text-sm font-bold text-white hover:bg-[#084f96] disabled:cursor-wait disabled:opacity-60"><BriefcaseBusiness className="size-5" /> {verificationState === 'loading' ? 'Checking the Powerlist...' : 'Verify with LinkedIn'} <ExternalLink className="size-4 opacity-70" /></button></form>{verificationState === 'eligible' && <div className="mt-5 rounded-2xl border border-[#b9ebce] bg-[#effcf4] p-4 text-sm text-[#176b3a]"><p className="font-bold">Verified — your ticket is ready.</p><p className="mt-1">{verifiedProfile?.title} can now receive the unique Avalanche badge in Core Wallet.</p></div>}{verificationState === 'not-found' && <p className="mt-5 rounded-2xl bg-[#fff7e8] p-4 text-sm text-[#805c17]">We couldn&apos;t find that LinkedIn profile in the Powerlist directory. Check the URL and try again.</p>}{verificationState === 'error' && <p className="mt-5 rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#9b2c2c]">The Powerlist service is unavailable right now. Please try again shortly.</p>}<p className="mt-5 text-center text-xs text-[#9aa8b5]">Authentication is handled by your LinkedIn integration. This test flow verifies against the live directory.</p><div className="mt-7 flex items-center gap-3 border-t border-[#edf0f3] pt-5 text-xs text-[#8a9bab]"><Ticket className="size-4" /> Your unique ticket will be minted on Avalanche.</div></div></div>}
    </main>
  )
}

<style jsx>{``}</style>
