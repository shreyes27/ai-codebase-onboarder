import logo from "../assets/logo15.webp";
import Green from "../components/Green";
import IcebergVisualization from "../components/IcebergVisualization";

const stages = [
  {
    number: "01",
    title: "Connect",
    label: "GITHUB",
    description:
      "Start with a repository URL. Codebase Onboarder pulls the actual source instead of relying on a description.",
    technical: "CLONE",
  },
  {
    number: "02",
    title: "Analyze",
    label: "STRUCTURE",
    description:
      "The repository is scanned to identify its project type, technologies, dependencies, relevant files and entry points.",
    technical: "SCAN",
  },
  {
    number: "03",
    title: "Understand",
    label: "CONTEXT",
    description:
      "Important modules and relationships are analyzed to build a compact picture of how the codebase actually works.",
    technical: "TRACE",
  },
  {
    number: "04",
    title: "Explain",
    label: "ONBOARDING",
    description:
      "The verified context is given to the LLM, then the generated guide is checked against the repository before it reaches you.",
    technical: "VALIDATE",
  },
];

function HowItWorksPage({ onHome, onAnalyze }) {
  return (
    <main
      className="min-h-screen overflow-hidden text-[color:var(--color-body)]"
      style={{
        backgroundColor: "var(--color-ink)",
      }}
    >
      <div className="relative h-[62px] shrink-0 border-b border-white/[0.08]">
        <div className="flex h-full items-center justify-between px-6 md:px-8 lg:px-10">
          <div className="group flex items-center">
            <button
              onClick={onHome}
              className="relative z-10 flex items-center rounded-lg focus-visible:outline-none"
              aria-label="Back to home"
            >
              <img
                src={logo}
                alt="Codebase Onboarder"
                className="relative top-px h-10 w-10 shrink-0 object-contain transition-all duration-200 group-hover:drop-shadow-[0_0_8px_rgba(201,162,39,0.25)] group-active:scale-95"
              />
            </button>

            <button
              onClick={onHome}
              className="-ml-2 max-w-0 overflow-hidden whitespace-nowrap rounded-r-lg px-0 text-sm text-zinc-500 opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:max-w-[80px] group-hover:px-3 group-hover:opacity-100 hover:text-zinc-100 focus-visible:outline-none"
            >
              ← Back
            </button>
          </div>

          <span className="text-[11px] text-zinc-700">shreyes / 2026</span>
        </div>
        {/* Page identity strip — same blended thirds as the navbar, this page's (emerald) zone lit up */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            background:
              "linear-gradient(to right, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.3) 27%, rgba(16,185,129,0.85) 37%, rgba(16,185,129,0.85) 63%, rgba(239,68,68,0.3) 73%, rgba(239,68,68,0.3) 100%)",
          }}
        />

        {/* Active page atmosphere (Professional Blended Bottom Glow) */}
        <div
          className="pointer-events-none absolute bottom-0 left-[30%] h-[14px] w-[40%] overflow-hidden"
          aria-hidden="true"
        >
          {/* Primary Soft Ambient Core */}
          <div
            className="h-full w-full blur-[6px] opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 65% 100% at 50% 100%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.08) 55%, transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
            }}
          />

          {/* Thin Crisp Base Edge Line */}
          <div
            className="absolute bottom-0 left-[15%] h-[1px] w-[70%] opacity-100 blur-[1.5px]"
            style={{
              background:
                "linear-gradient(to right, transparent 0%, rgba(16,185,129,0.55) 30%, rgba(16,185,129,1.5) 50%, rgba(16,185,129,0.55) 70%, transparent 100%)",
            }}
          />
        </div>
      </div>

      <section className="relative border-b border-white/[0.08]">
        <Green />

        {/* Iceberg — decorative background layer */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
          <div className="pointer-events-auto absolute right-[130px] top-[30px] w-[560px]">
            <IcebergVisualization />
          </div>
        </div>

        {/* Background grid, faded at the edges instead of a hard-edged tile */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 90%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 20%, black 40%, transparent 90%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-[1380px] px-6 pb-24 pt-15 md:px-10 lg:px-12 md:pb-32 md:pt-18">
          {/* Heading */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-[color:var(--color-brass)]/60" />
              <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-brass)]">
                How it works
              </p>
            </div>

            <h1 className="mt-5 text-[42px] font-medium leading-[1.04] tracking-[-0.04em] text-zinc-100 sm:text-[50px] md:text-[60px]">
              Your repo. <br />
              <span className="bg-gradient-to-r from-zinc-100 via-emerald-200 to-[#10b981] bg-clip-text text-transparent">
                Understood.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-7 text-zinc-400">
              A repository goes through several layers of analysis before
              Codebase Onboarder attempts to explain it.
            </p>
          </div>

          {/* Stepped Layout (Cards thode transparent / translucent) */}
          <div className="relative mt-16 md:mt-20">
            <div className="relative -ml-20 md:h-[470px]">
              {stages.map((stage, index) => (
                <div
                  key={stage.number}
                  className="group relative md:absolute"
                  style={{
                    // All boxes aligned on the same vertical line
                    top: `${index * 135}px`,
                    left: `${index * 135}px`,
                  }}
                >
                  <div className="flex items-start gap-4 md:w-[500px]">
                    {/* Numbered Badge (translucent frosted) */}
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-brass)]/40 bg-[#0d0d0f]/80 backdrop-blur-sm font-[var(--font-mono)] text-[13px] text-[color:var(--color-brass)] transition-colors duration-300 group-hover:border-[color:var(--color-brass)] group-hover:bg-[color:var(--color-brass)]/15">
                      {stage.number}
                    </div>

                    {/* Box (thoda transparent / glass translucent) */}
                    <div className="relative flex-1 min-h-[100px] border border-white/[0.12] bg-[#0d0d0f]/5 backdrop-blur-md px-5 py-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[color:var(--color-brass)]/40 group-hover:bg-[#0d0d0f]/20 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
                      {/* Corner brackets */}
                      <span className="pointer-events-none absolute -left-px -top-px h-3 w-3 border-l border-t border-white/[0.22] transition-colors duration-300 group-hover:border-[color:var(--color-brass)]/50" />
                      <span className="pointer-events-none absolute -bottom-px -right-px h-3 w-3 border-b border-r border-white/[0.22] transition-colors duration-300 group-hover:border-[color:var(--color-brass)]/50" />

                      <div className="flex items-start justify-between gap-4">
                        <span className="rounded-sm border border-white/[0.12] px-1.5 py-0.5 font-[var(--font-mono)] text-[8px] uppercase tracking-[0.14em] text-zinc-400">
                          {stage.label}
                        </span>

                        <span className="font-[var(--font-mono)] text-[8px] uppercase tracking-[0.16em] text-zinc-500">
                          {stage.technical}
                        </span>
                      </div>

                      <h2 className="mt-2 text-[17px] font-medium tracking-[-0.02em] text-zinc-200 transition-colors duration-300 group-hover:text-emerald-300">
                        {stage.title}
                      </h2>

                      <p className="mt-1.5 max-w-[390px] text-[12px] leading-[1.45] text-zinc-400">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligence layer (Wider spread & crisp translucent text) */}
          <div className=" border-t border-white/[0.08] pt-16 md:mt-32 md:pt-12"
          style={{ marginTop: "110px" }}>
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 items-start">
              {/* Intro */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-6 bg-[color:var(--color-brass)]/60" />

                  <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-brass)]">
                    The intelligence layer
                  </p>
                </div>

                <h2 className="mt-5 text-[32px] font-medium leading-[1.1] tracking-[-0.035em] text-zinc-100 md:text-[40px]">
                  Let AI do the explaining.
                  <br />
                  <span className="bg-gradient-to-r from-zinc-100 to-[#10b981] bg-clip-text text-transparent">
                    The code keeps it honest.
                  </span>
                </h2>

                <p className="mt-5 text-[15px] leading-7 text-zinc-300">
                  Once the repository has been analyzed, its verified context is
                  passed to a language model. The model turns that evidence into
                  an explanation that developers can actually follow.
                </p>
              </div>

              {/* Providers (Spread to full available grid width) */}
              <div className="space-y-0 border-y border-white/[0.1] bg-white/[0.02] backdrop-blur-sm">
                {/* Groq */}
                <div className="group border-b border-white/[0.08] px-6 py-6 transition-all duration-300 hover:border-[color:var(--color-brass)]/[0.22] hover:bg-[color:var(--color-brass)]/[0.03]">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-[var(--font-mono)] text-[11px] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                          01
                        </span>

                        <h3 className="text-[19px] font-medium tracking-[-0.02em] text-zinc-100 transition-colors duration-300 group-hover:text-zinc-50">
                          Groq
                        </h3>

                        <span className="rounded-sm border border-white/[0.14] px-1.5 py-0.5 font-[var(--font-mono)] text-[8px] uppercase tracking-[0.14em] text-zinc-300 transition-all duration-300 group-hover:border-[color:var(--color-brass)]/[0.3] group-hover:text-[color:var(--color-brass)]">
                          PRIMARY
                        </span>
                      </div>

                      <p className="mt-2.5 text-[14px] leading-6 text-zinc-300 transition-colors duration-300 group-hover:text-zinc-200">
                        The current primary inference provider, chosen for fast
                        generation and a responsive onboarding experience.
                      </p>
                    </div>

                    <span className="shrink-0 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                      FAST
                    </span>
                  </div>
                </div>

                {/* Gemini */}
                <div className="group border-b border-white/[0.08] px-6 py-6 transition-all duration-300 hover:border-[color:var(--color-brass)]/[0.22] hover:bg-[color:var(--color-brass)]/[0.03]">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-[var(--font-mono)] text-[11px] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                          02
                        </span>

                        <h3 className="text-[19px] font-medium tracking-[-0.02em] text-zinc-100 transition-colors duration-300 group-hover:text-zinc-50">
                          Gemini
                        </h3>

                        <span className="rounded-sm border border-white/[0.14] px-1.5 py-0.5 font-[var(--font-mono)] text-[8px] uppercase tracking-[0.14em] text-zinc-300 transition-all duration-300 group-hover:border-[color:var(--color-brass)]/[0.3] group-hover:text-[color:var(--color-brass)]">
                          OPTIONAL
                        </span>
                      </div>

                      <p className="mt-2.5 text-[14px] leading-6 text-zinc-300 transition-colors duration-300 group-hover:text-zinc-200">
                        A configurable alternative that can be enabled by the
                        administrator when a different model or provider is
                        preferred.
                      </p>
                    </div>

                    <span className="shrink-0 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                      OPTIONAL
                    </span>
                  </div>
                </div>

                {/* Ollama */}
                <div className="group border-b border-white/[0.08] px-6 py-6 transition-all duration-300 hover:border-[color:var(--color-brass)]/[0.22] hover:bg-[color:var(--color-brass)]/[0.03]">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-[var(--font-mono)] text-[11px] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                          03
                        </span>

                        <h3 className="text-[19px] font-medium tracking-[-0.02em] text-zinc-100 transition-colors duration-300 group-hover:text-zinc-50">
                          Ollama
                        </h3>

                        <span className="rounded-sm border border-white/[0.14] px-1.5 py-0.5 font-[var(--font-mono)] text-[8px] uppercase tracking-[0.14em] text-zinc-300 transition-all duration-300 group-hover:border-[color:var(--color-brass)]/[0.3] group-hover:text-[color:var(--color-brass)]">
                          LOCAL
                        </span>
                      </div>

                      <p className="mt-2.5 text-[14px] leading-6 text-zinc-300 transition-colors duration-300 group-hover:text-zinc-200">
                        A local-model option for deployments where inference
                        should remain on the developer's own machine.
                      </p>
                    </div>

                    <span className="shrink-0 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                      LOCAL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How the model fits into the pipeline (Widened & translucent) */}
            <div className="mt-12 w-full border border-white/[0.1] bg-black/[0.095] backdrop-blur-sm transition-all duration-300 hover:border-[color:var(--color-brass)]/[0.25] hover:bg-[color:var(--color-brass)]/[0.025]">
              <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
                <div className="max-w-3xl">
                  <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                    One pipeline, different models
                  </p>

                  <p className="mt-3 text-[14px] leading-6 text-zinc-300">
                    The repository analysis stays independent from the model.
                    Groq is the primary choice today, while an administrator
                    can switch to another configured provider as requirements
                    change.
                  </p>
                </div>

                <div className="shrink-0 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  <span className="text-[color:var(--color-brass)] font-semibold">GROQ</span>
                  <span className="mx-2 text-zinc-600">/</span>
                  <span className="text-zinc-300">GEMINI</span>
                  <span className="mx-2 text-zinc-600">/</span>
                  <span className="text-zinc-300">OLLAMA</span>
                </div>
              </div>
            </div>

            {/* Simple explanation (Wide 3-column spread with crisp translucent text) */}
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <div className="group border border-white/[0.1] bg-black/[0.095] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-brass)]/[0.25] hover:bg-[color:var(--color-brass)]/[0.03]">
                <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                  First
                </p>

                <p className="mt-3 text-[14px] leading-6 text-zinc-300">
                  The analyzer finds what actually matters inside the
                  repository.
                </p>
              </div>

              <div className="group border border-white/[0.1] bg-black/[0.095] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-brass)]/[0.25] hover:bg-[color:var(--color-brass)]/[0.03]">
                <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                  Then
                </p>

                <p className="mt-3 text-[14px] leading-6 text-zinc-300">
                  That evidence becomes the context the language model works
                  from.
                </p>
              </div>

              <div className="group border border-white/[0.1] bg-black/[0.095] backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-brass)]/[0.25] hover:bg-[color:var(--color-brass)]/[0.03]">
                <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors duration-300 group-hover:text-[color:var(--color-brass)]">
                  Finally
                </p>

                <p className="mt-3 text-[14px] leading-6 text-zinc-200">
                  The generated explanation is checked against the repository
                  before it becomes your onboarding guide.
                </p>
              </div>
            </div>
          </div>

          {/* Pipeline annotation — terminal-style footer */}
          <div className="mt-24 flex flex-col gap-4 border-t border-white/[0.08] pt-0.5 sm:flex-row sm:items-center sm:justify-between md:mt-15">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 font-[var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <span className="text-zinc-700">[</span>
              <span>CLONE</span>
              <span className="text-zinc-700">→</span>
              <span>SCAN</span>
              <span className="text-zinc-700">→</span>
              <span>TRACE</span>
              <span className="text-zinc-700">→</span>
              <span>CONTEXT</span>
              <span className="text-zinc-700">→</span>
              <span>VALIDATE</span>
              <span className="text-zinc-700">]</span>
            </div>

            <span className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              No guesswork. Just evidence.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default HowItWorksPage;
