import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { PWAFeatures } from '@/components/pwa-features'

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-white selection:text-black">
      {/* Background Grid Pattern - Very subtle, technical */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>

      <nav className="fixed top-0 w-full z-50 border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-white font-black tracking-tighter text-xl">WN__</div>
          <div className="flex items-center gap-6 text-xs font-bold tracking-widest uppercase">
            <SignedIn>
              <Link href="/console" className="hover:text-white transition-colors">Console</Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="hover:text-white transition-colors">Authenticate</button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 container mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <div className="mb-8 inline-flex items-center gap-3 px-3 py-1 border border-zinc-800 bg-zinc-950 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
              <span className="w-1.5 h-1.5 bg-zinc-500"></span>
              Production-Grade Environment
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-[0.9] mb-8" style={{ wordSpacing: '-0.1em' }}>
              Absolute <br /> Task Control.
            </h1>

            <p className="text-lg sm:text-2xl font-light text-zinc-400 max-w-2xl leading-relaxed tracking-wide mb-12 border-l border-zinc-800 pl-6">
              A brutalist execution environment for task reminders and management. Built for maximum efficiency, zero distraction, and uncompromising performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <SignedIn>
                <Link href="/console" className="px-8 py-5 bg-white text-black text-sm font-bold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors text-center">
                  Access Console
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/console" signUpFallbackRedirectUrl="/console">
                  <button className="px-8 py-5 bg-white text-black text-sm font-bold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">
                    Initialize Session
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:ml-auto w-full">
            <PWAFeatures />
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-black py-8 mt-12">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
          <div>WHATNEXT // SYS_VER_0.1.0</div>
          <div>POWERED BY NEXT.JS</div>
        </div>
      </footer>
    </div>
  )
}
