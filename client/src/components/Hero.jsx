import RepoSchematic from "./RepoSchematic"
import VortexBackground from "../components/VortexBackground"

function Hero({ onAnalyze }) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.08]">
      <VortexBackground />
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle technical grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        {/* Cinematic space atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                ellipse 62% 110% at -8% 50%,
                rgba(112, 55, 205, 0.34) 0%,
                rgba(91, 42, 175, 0.25) 24%,
                rgba(65, 30, 125, 0.15) 45%,
                rgba(38, 20, 72, 0.07) 65%,
                transparent 78%
              ),

              radial-gradient(
                ellipse 62% 110% at 108% 50%,
                rgba(112, 55, 205, 0.34) 0%,
                rgba(91, 42, 175, 0.25) 24%,
                rgba(65, 30, 125, 0.15) 45%,
                rgba(38, 20, 72, 0.07) 65%,
                transparent 78%
              ),

              radial-gradient(
                ellipse 85% 90% at 50% 50%,
                rgba(45, 24, 82, 0.13) 0%,
                rgba(14, 10, 22, 0.30) 48%,
                rgba(10, 10, 11, 0.68) 100%
              )
            `,
          }}
        />

        {/* Very subtle center atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background:
                "radial-gradient(circle at 54% 50%, rgba(125, 65, 195, 0.085), transparent 48%)",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-[620px] max-w-[1440px] items-center gap-16 px-6 py-20 md:grid-cols-[0.95fr_1.05fr] md:px-10 md:py-24 lg:min-h-[680px] lg:px-16 lg:py-28">
        <div className="max-w-[620px]">
          <p className="mb-7 font-[var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-brass)]">
            Repository intelligence
          </p>

          <h1 className="max-w-[600px] text-[44px] font-medium leading-[1.04] tracking-[-0.04em] text-zinc-50 sm:text-[50px] md:text-[56px] lg:text-[64px]">
            Every repository
            <br />
            has a story to tell.
          </h1>

          <div className="mt-7 max-w-[520px] space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-brass)]" />
              <p className="text-[15px] leading-7 text-zinc-400">
                <span className="font-medium text-zinc-200">
                  New repo. Zero context.
                </span>{" "}
                Start with the bigger picture.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-brass)]" />
              <p className="text-[15px] leading-7 text-zinc-400">
                <span className="font-medium text-zinc-200">
                  Skip the digging.
                </span>{" "}
                Know where to begin before opening hundreds of files.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-brass)]" />
              <p className="text-[15px] leading-7 text-zinc-400">
                <span className="font-medium text-zinc-200">
                  Get productive faster.
                </span>{" "}
                Turn an unfamiliar codebase into familiar ground.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <button
              onClick={onAnalyze}
              className="rounded-xl bg-zinc-100/80 px-6 py-3.5 text-sm font-medium text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--color-brass)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brass)]"
            >
              Analyze a repository
            </button>

            
          </div>
        </div>

        <div className="flex min-h-[360px] items-center justify-center md:min-h-[470px] md:justify-end">
          <RepoSchematic />
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 py-4 md:px-10 lg:px-16">
        <span className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-zinc-700">
          Built from repository evidence
        </span>

        <span className="text-[13px] font-medium tracking-[0.08em] text-zinc-500">
          Shreyes / 2026
        </span>
      </div>
    </section>
  )
}

export default Hero