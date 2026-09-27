const capabilities = [
  {
    number: "01",
    title: "Repository structure",
    description:
      "Before explaining anything, the analyzer builds a map of what actually exists inside the repository.",
    points: [
      "Scans folders, files and project boundaries",
      "Detects technologies and project type",
      "Finds the files that matter most",
    ],
  },
  {
    number: "02",
    title: "Execution & dependencies",
    description:
      "It traces how the application starts, where the important logic lives and how different parts of the codebase connect.",
    points: [
      "Finds real entry points and startup paths",
      "Maps important modules and dependencies",
      "Follows how the application actually connects",
    ],
  },
  {
    number: "03",
    title: "Fast, focused analysis",
    description:
      "Large repositories do not need every file explained. The analyzer prioritizes the useful context and keeps the pipeline focused.",
    points: [
      "Prioritizes relevant files automatically",
      "Keeps context compact for faster generation",
      "Works across small and large repositories",
    ],
  },
  {
    number: "04",
    title: "Grounded onboarding",
    description:
      "The LLM does not get to freely invent the project. Its explanation is built from repository evidence and checked before delivery.",
    points: [
      "Uses verified repository context",
      "Checks generated paths against analyzed files",
      "Reduces hallucinated modules and entry points",
    ],
  },
]

function Features() {
  return (
    <section
      id="capabilities"
      className="relative overflow-hidden border-b border-white/[0.08] bg-[#0a0810] text-[#ededef]"
    >
      {/* Deep color wash — purple from top-left, brass corners at top-right and bottom-right, tonal shift */}
{/* Deep color wash — purple from top-left, brass warmth easing down the right edge */}
<div
  className="pointer-events-none absolute inset-0"
  style={{
    background:
      "radial-gradient(ellipse 70% 60% at 8% -5%, rgba(128,98,174,0.20), transparent 60%), radial-gradient(ellipse 55% 75% at 100% 0%, rgba(201,162,39,0.11), transparent 68%), radial-gradient(ellipse 60% 55% at 100% 105%, rgba(201,162,39,0.09), transparent 62%), linear-gradient(180deg, #0a0810 0%, #120e1a 100%)",
  }}
/>
      

      {/* Grain — the thing that actually reads as "premium material" rather than a flat CSS gradient */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.045] mix-blend-overlay">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div className="relative mx-auto max-w-[1600px] px-6 py-14 md:px-12 md:py-20 xl:px-20">
        {/* Header */}
        <div className="grid gap-7 pb-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:pb-14">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[color:var(--color-brass)]/60" />
              <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-brass)]">
                Capabilities
              </p>
            </div>

            <h2 className="mt-4 max-w-xl text-[34px] font-medium leading-[1.06] tracking-[-0.045em] text-[#f0f0f2] md:text-[46px]">
              What it sees.
              <br />
              <span className="text-[#aaa4b7]">What it understands.</span>
            </h2>
          </div>

          <div className="flex items-end md:justify-end">
            <p className="max-w-xl text-[15px] leading-7 text-[#8b8593]">
              Codebase Onboarder builds an evidence-backed picture of the
              repository before asking the model to explain it. Every layer
              adds context without losing sight of the code that actually
              exists.
            </p>
          </div>
        </div>

        {/* Capability map — layered glass: gradient border, inner top highlight, soft elevation on hover */}
        <div className="space-y-3 md:space-y-4">
          {capabilities.map((item) => (
            <div
              key={item.number}
              className="group relative rounded-xl p-px transition-all duration-300 ease-out hover:-translate-y-[1px]"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02) 40%, rgba(128,98,174,0.10) 100%)",
              }}
            >
              <div
                className="relative overflow-hidden rounded-[11px] bg-[#151220]/70 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {/* Hover glow — soft, from the accent corner, not a hard bar */}
                <div
                  className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "rgba(128,98,174,0.25)" }}
                />

                <div className="relative grid gap-4 px-5 py-5 md:grid-cols-[64px_1fr] md:gap-6 md:px-6 md:py-6">
                  {/* Number as a quiet structural mark, not a floating label */}
                  <div className="flex flex-row items-center gap-3 md:flex-col md:items-start md:gap-0">
                    <span
                      className="font-[var(--font-mono)] text-[28px] font-light leading-none tracking-tight text-[#5b5267] transition-colors duration-300 md:text-[30px] group-hover:text-[#5a4d6e]"
                    >
                      {item.number}
                    </span>

                    {/* Vertical rule ties the number down into the card body instead of leaving it isolated */}
                    <span className="hidden w-px flex-1 bg-gradient-to-b from-white/[0.08] to-transparent md:mt-3 md:block" />
                  </div>

                  <div>
                    <h3 className="text-[19px] font-medium leading-snug text-[#f2eff5] md:text-[21px]">
                      {item.title}
                    </h3>

                    <p className="mt-2 max-w-[60ch] text-[13.5px] leading-6 text-[#a49bad] md:text-[14px]">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          key={point}
                          className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1 text-[11.5px] text-[#b8afc1]"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <div className="mt-8 border-t border-white/[0.08] pt-5">
          <p className="text-[13px] text-[#6f6a78]">
            Structure comes first, understanding follows.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Features