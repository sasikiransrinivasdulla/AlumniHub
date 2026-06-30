export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-6 relative overflow-hidden select-none">
      {/* Subtle radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />

      {/* Main Content Container */}
      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-lg">
        {/* Decorative thin line */}
        <div className="w-12 h-[1px] bg-neutral-800" />

        {/* Title and Subtitle */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.25em] uppercase text-white">
            Alumni Hub
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm font-medium tracking-[0.3em] uppercase">
            Reconnect. Remember. Relive.
          </p>
        </div>

        {/* Decorative thin line */}
        <div className="w-12 h-[1px] bg-neutral-800" />

        {/* Coming Soon Button */}
        <div className="pt-4">
          <button 
            type="button"
            className="px-8 py-3 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase rounded-none border border-white hover:bg-black hover:text-white transition-all duration-500 ease-out cursor-default shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-none"
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <span className="text-[10px] text-neutral-600 tracking-[0.4em] uppercase font-light">
          Alumni Hub &copy; {new Date().getFullYear()}
        </span>
      </div>
    </main>
  );
}
