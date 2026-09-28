import { useEffect, useState } from "react"
import logo from "../assets/logo15.webp"

// One color per page, in the order the strip reads left to right.
const PAGE_COLORS = {
  home: "139, 92, 246", // purple
  "how-it-works": "16, 185, 129", // emerald
  analyze: "239, 68, 68", // red
}

// Builds a single smoothly-blended gradient (not hard-edged blocks):
// each page gets an EQUAL solid plateau (not just a single center
// point), with a shared transition zone melting into the next one.
// 3 plateaus of ~27% + 2 transition zones of 10% = 100%.
// When currentPage matches a zone, that zone glows a little brighter
// and the other two settle back — enough to feel cohesive without
// being a loud "you are here" marker.
function buildStripGradient(currentPage) {
  const activeOpacity = 0.85
  const mutedOpacity = 0.3

  const opacityFor = (key) =>
    key === currentPage ? activeOpacity : mutedOpacity

  const home = `rgba(${PAGE_COLORS.home}, ${opacityFor("home")})`
  const howItWorks = `rgba(${PAGE_COLORS["how-it-works"]}, ${opacityFor("how-it-works")})`
  const analyze = `rgba(${PAGE_COLORS.analyze}, ${opacityFor("analyze")})`

  return `linear-gradient(to right, ${home} 0%, ${home} 27%, ${howItWorks} 37%, ${howItWorks} 63%, ${analyze} 73%, ${analyze} 100%)`
}

function Navbar({
  onAnalyze,
  onHome,
  onHowItWorks,
  currentPage = "home",
}) {
  const [reposAnalyzed, setReposAnalyzed] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadStats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/stats`,
        )

        if (!response.ok) {
          throw new Error("Failed to load stats")
        }

        const data = await response.json()

        if (!cancelled) {
          setReposAnalyzed(
            Number(data.repos_analyzed ?? 0),
          )
        }
      } catch {
        if (!cancelled) {
          setReposAnalyzed(null)
        }
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <nav className="relative z-20 h-[62px] shrink-0 border-b border-white/[0.08]">
      <div className="flex h-full w-full items-center justify-between px-6 md:px-8 lg:px-10">

        {/* Brand */}
        <button
          onClick={onHome}
          className="group flex items-center gap-2 rounded-xl text-left focus-visible:outline-none"
          aria-label="Go to homepage"
        >
          <img
            src={logo}
            alt="Codebase Onboarder"
            className="relative top-px h-10 w-10 shrink-0 object-contain transition-all duration-200 group-hover:drop-shadow-[0_0_8px_rgba(201,162,39,0.18)] group-active:scale-[0.96] group-active:drop-shadow-[0_0_10px_rgba(201,162,39,0.4)]"
          />

          <span>
            <span className="block text-[15px] font-medium tracking-[-0.02em] text-zinc-100">
              Codebase Onboarder
            </span>

            <span className="mt-0.5 block font-[var(--font-mono)] text-[8px] uppercase tracking-[0.18em] text-zinc-600">
              FROM CODE TO CONTEXT
            </span>
          </span>
        </button>

        {/* Navigation */}
        <div className="hidden items-center gap-9 md:flex">
          <a
            href="#capabilities"
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
          >
            Capabilities
          </a>

          <button
            onClick={onHowItWorks}
            className="text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
          >
            How it works
          </button>

          <a
            href="https://github.com/shreyes27/ai-codebase-onboarder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-zinc-500 transition-colors duration-200 hover:text-zinc-200"
            aria-label="Browse repository on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.34-3.369-1.34-.455-1.156-1.11-1.464-1.11-1.464-.908-.621.069-.609.069-.609 1.004.071 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.092.39-1.984 1.029-2.682-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.203 2.394.1 2.647.64.698 1.028 1.59 1.028 2.682 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.337-.012 2.416-.012 2.744 0 .269.18.58.688.481A10.001 10.001 0 0 0 22 12C22 6.477 17.523 2 12 2Z" />
            </svg>

            <span>Browse repo</span>
          </a>
        </div>

        {/* Repository stats */}
        <div className="hidden w-[230px] shrink-0 items-center justify-end gap-2.5 md:flex">
          <span className="text-[12px] font-medium tracking-[-0.01em] text-[color:var(--color-brass)]">
            {reposAnalyzed === null
              ? "—"
              : reposAnalyzed.toLocaleString()}
          </span>

          <span className="text-[12px] font-normal tracking-[-0.01em] text-zinc-400">
            Repos analyzed
          </span>
        </div>
      </div>

      {/* Page-identity strip: purple (home) -> emerald (how it works) -> red (analyze),
          equal thirds, blended at the seams instead of hard-cut. */}

      <div
        className="pointer-events-none absolute bottom-[2px] left-0 h-[18px] w-[27%]"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at left bottom, rgba(139,92,246,0.25), transparent 75%)",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
        style={{ background: buildStripGradient(currentPage) }}
        aria-hidden="true"
      />
    </nav>
  )
}

export default Navbar