import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import logo from "../assets/logo15.webp"
import ResultSidebar from "../components/ResultSidebar"
import AnalysisVisual from "../components/AnalysisVisual"
import {
  GuideSectionBody,
  parseGuideIntoSections,
} from "../components/GuideContent"

const QUICK_REPOS = [
  {
    name: "Hello World",
    url: "https://github.com/octocat/Hello-World",
  },
  {
    name: "Click",
    url: "https://github.com/pallets/click",
  },
  {
    name: "Express",
    url: "https://github.com/expressjs/express",
  },
  {
    name: "Vite",
    url: "https://github.com/vitejs/vite",
  },
]

function RepositoryPage({ onBack }) {
  const [repoUrl, setRepoUrl] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")
  const [rateLimitError, setRateLimitError] = useState(false)
  const [result, setResult] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)

  const sections = useMemo(
    () =>
      result
        ? parseGuideIntoSections(result.onboarding_guide)
        : [],
    [result],
  )

  const activeSection =
    sections.find(
      (section) => section.id === activeSectionId,
    ) ??
    sections[0] ??
    null

  const activeIndex = sections.findIndex(
    (section) => section.id === activeSection?.id,
  )

  // Only changes the active section — does NOT force-scroll the page.
  const goToIndex = (index) => {
    if (index < 0 || index >= sections.length) return
    setActiveSectionId(sections[index].id)
  }

  useEffect(() => {
    if (status !== "success") return

    const handleKeyDown = (event) => {
      const target = event.target

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA"

      if (isTyping) return

      if (event.key === "ArrowRight") {
        goToIndex(activeIndex + 1)
      }

      if (event.key === "ArrowLeft") {
        goToIndex(activeIndex - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
  }, [activeIndex, sections, status])

  const handleAnalyze = async (event) => {
    event?.preventDefault()

    const trimmedUrl = repoUrl.trim()

    if (!trimmedUrl) {
      setError("Enter a GitHub repository URL first.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setError("")
    setRateLimitError(false)
    setResult(null)
    setActiveSectionId(null)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/onboard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo_url: trimmedUrl,
            force_refresh: false,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("__GROQ_RATE_LIMIT__")
        }

        throw new Error(
          data.detail ||
            "Unable to analyze this repository.",
        )
      }

      setResult(data)

      const parsed = parseGuideIntoSections(
        data.onboarding_guide,
      )

      setActiveSectionId(
        parsed[0]?.id ?? null,
      )

      setStatus("success")
    } catch (requestError) {
      if (requestError.message === "__GROQ_RATE_LIMIT__") {
        setRateLimitError(true)
        setStatus("error")
        return
      }

      setStatus("error")

      setError(
        requestError.message ||
          "Something went wrong while analyzing the repository.",
      )
    }
  }

  const handleQuickRepo = (url) => {
    setRepoUrl(url)
    setError("")
    setStatus("idle")
  }

  const handleNewRepository = () => {
    setRepoUrl("")
    setError("")
    setResult(null)
    setActiveSectionId(null)
    setStatus("idle")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const isWorkspace =
    status === "success" && result

  const totalFiles = Number(
    result?.analysis_summary?.total_files ?? 0,
  )

  const contextBudgetExceeded =
    result?.context_budget_exceeded === true ||
    result?.budget_exceeded === true ||
    totalFiles > 5000

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[color:var(--color-body)]">
      {/* ============================================================
          NAVBAR
      ============================================================ */}

      <header className="relative z-50 h-[62px] shrink-0 border-b border-white/[0.08] bg-[#050505]">
        <div className="flex h-full items-center justify-between px-6 md:px-8 lg:px-10">
          <div className="group flex items-center">
            <button
              onClick={onBack}
              className="relative z-10 flex items-center rounded-lg focus-visible:outline-none"
              aria-label="Back to home"
            >
              <img
                src={logo}
                alt="Codebase Onboarder"
                className="
                  relative
                  top-px
                  h-10
                  w-10
                  object-contain
                  transition-all
                  duration-200
                  group-hover:drop-shadow-[0_0_8px_rgba(201,162,39,0.25)]
                  group-active:scale-95
                "
              />
            </button>

            <button
              onClick={onBack}
              className="
                -ml-2
                max-w-0
                overflow-hidden
                whitespace-nowrap
                rounded-r-lg
                px-0
                text-sm
                text-zinc-500
                opacity-0
                transition-all
                duration-300
                ease-out
                group-hover:ml-2
                group-hover:max-w-[80px]
                group-hover:px-3
                group-hover:opacity-100
                hover:text-zinc-100
                focus-visible:outline-none
              "
            >
              ← Back
            </button>
          </div>

          <span className="text-[11px] text-zinc-700">
            shreyes / 2026
          </span>
        </div>

        {/* Existing identity strip */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            background:
              "linear-gradient(to right, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0.3) 27%, rgba(16,185,129,0.3) 37%, rgba(16,185,129,0.3) 63%, rgba(239,68,68,0.85) 73%, rgba(239,68,68,0.85) 100%)",
          }}
        />

        <div
          className="pointer-events-none absolute bottom-[2px] right-0 h-[18px] w-[27%]"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at right bottom, rgba(239,68,68,0.25), transparent 75%)",
          }}
          aria-hidden="true"
        />
      </header>

      {/* ============================================================
          ANALYZE STATE
      ============================================================ */}

      {!isWorkspace && (
        <section className="relative isolate min-h-[calc(100vh-62px)] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <AnalysisVisual status={status} />
          </div>

          <div className="pointer-events-none absolute inset-0 z-0">
            {/* Engineering grid */}
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
                `,
                backgroundSize: "36px 36px",
                maskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)",
              }}
            />

            {/* Ambient glow */}
            <div
              className="
                absolute
                left-1/2
                top-[38%]
                h-[600px]
                w-[860px]
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                blur-[120px]
              "
              style={{
                background:
                  "radial-gradient(circle, rgba(140,30,30,0.16) 0%, rgba(70,15,15,0.08) 50%, transparent 75%)",
                animation:
                  "ambientPulse 12s ease-in-out infinite alternate",
              }}
              aria-hidden="true"
            />

            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-900/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
          </div>

          <style>{`
            @keyframes ambientPulse {
              0% {
                transform: translate(-50%, -50%) scale(0.95);
                opacity: 0.75;
              }

              100% {
                transform: translate(-50%, -50%) scale(1.06);
                opacity: 1;
              }
            }
          `}</style>

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-62px)] w-full max-w-6xl items-start justify-center px-5 pb-16 pt-14 sm:px-8 md:pt-20">
            <div className="w-full max-w-[600px]">
              {/* Analyze Card */}
              <div className="mx-auto w-full max-w-[420px] translate-y-16 rounded-xl border border-[#8a4a4a] bg-gradient-to-b from-[#282020] to-[#1a1616] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(140,50,50,0.12)]">
                <div className="h-px w-full rounded-t-xl bg-gradient-to-r from-transparent via-[#c47a7a]/70 to-transparent" />

                <div className="px-6 py-6">
                  <h1 className="mb-5 text-[19px] font-medium tracking-[-0.02em] text-zinc-50">
                    Analyze Repository
                  </h1>

                  <form onSubmit={handleAnalyze}>
                    <label
                      htmlFor="repo-url"
                      className="mb-1.5 block text-[11px] text-zinc-400"
                    >
                      GitHub repository URL
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        id="repo-url"
                        type="url"
                        autoComplete="off"
                        value={repoUrl}
                        onChange={(event) =>
                          setRepoUrl(event.target.value)
                        }
                        placeholder="https://github.com/user/project"
                        disabled={status === "loading"}
                        className="
                          min-w-0
                          flex-1
                          rounded-md
                          border
                          border-[#7a4040]
                          bg-[#332828]
                          px-3
                          py-2.5
                          text-[13px]
                          text-zinc-100
                          outline-none
                          transition-colors
                          duration-150
                          placeholder:text-zinc-600
                          focus:border-[#c47a7a]
                          focus:shadow-[0_0_0_3px_rgba(196,122,122,0.14)]
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      />

                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="
                          shrink-0
                          rounded-md
                          border
                          border-[#a85858]
                          bg-gradient-to-b
                          from-[#8a4444]
                          to-[#682f2f]
                          px-4
                          py-2.5
                          text-[13px]
                          font-medium
                          text-zinc-50
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_14px_rgba(120,40,40,0.3)]
                          transition-colors
                          duration-150
                          hover:border-[#c47a7a]
                          hover:from-[#9c4e4e]
                          hover:to-[#763636]
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        {status === "loading"
                          ? "Analyzing"
                          : "Analyze"}
                      </button>
                    </div>
                  </form>

                  {/* Quick Check — layout preserved while loading */}
                  <div
                    className={`mt-5 ${
                      status === "loading"
                        ? "invisible"
                        : "visible"
                    }`}
                  >
                    <span className="mb-2 block text-[10px] uppercase tracking-[0.14em] text-[#b08585]">
                      Quick Check
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_REPOS.map((repo) => (
                        <button
                          key={repo.url}
                          type="button"
                          onClick={() =>
                            handleQuickRepo(repo.url)
                          }
                          className="
                            rounded-md
                            border
                            border-[#5a3838]/70
                            bg-white/[0.03]
                            px-2.5
                            py-1.5
                            text-[11px]
                            text-zinc-400
                            transition-colors
                            duration-150
                            hover:border-[#a85858]
                            hover:bg-white/[0.05]
                            hover:text-zinc-200
                          "
                        >
                          {repo.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {status === "error" && (
                <div className="mx-auto mt-7 max-w-2xl text-center">
                  {rateLimitError ? (
                    <p className="text-[13px] text-zinc-500">
                      Please try again after 1 minute.
                    </p>
                  ) : (
                    <div className="relative border border-[#5d2929]/50 bg-[#100909]/90 p-6 text-left">
                      <p className="text-sm font-medium text-[#c27a7a]">
                        Analysis failed
                      </p>

                      <p className="mt-2 text-[14px] leading-6 text-zinc-500">
                        {error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          RESULT WORKSPACE
      ============================================================ */}

      {isWorkspace && (
        <div className="relative min-h-[calc(100vh-62px)] bg-[#09080b]">
          {/* Flowing color waves */}
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="
                absolute
                -left-[15%]
                top-[8%]
                h-[420px]
                w-[130%]
                rounded-[50%]
                bg-[radial-gradient(ellipse_at_center,rgba(145,32,42,0.20),transparent_68%)]
                rotate-[-5deg]
              "
            />

            <div
              className="
                absolute
                -left-[20%]
                top-[25%]
                h-[360px]
                w-[140%]
                rounded-[50%]
                bg-[radial-gradient(ellipse_at_center,rgba(105,25,38,0.16),transparent_68%)]
                rotate-[4deg]
              "
            />

            <div
              className="
                absolute
                -left-[15%]
                top-[48%]
                h-[430px]
                w-[130%]
                rounded-[50%]
                bg-[radial-gradient(ellipse_at_center,rgba(165,38,45,0.12),transparent_68%)]
                rotate-[-3deg]"
            />
          </div>

          {/* Soft top glow to match the analyze-state ambience */}
          {/* Side red ambience */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 75% at 0% 45%, rgba(95,24,30,0.16), transparent 70%), radial-gradient(ellipse 55% 75% at 100% 45%, rgba(125,28,36,0.20), transparent 70%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            {/* Large repository notice */}
            {contextBudgetExceeded && (
              <div className="border-b border-[#4c2020]/60 bg-[#100909] px-5 py-3 sm:px-8 lg:px-10">
                <div className="mx-auto flex max-w-[1500px] items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b3535]" />

                  <p className="text-[11px] leading-5 text-zinc-500">
                    <span className="text-zinc-400">
                      Repository exceeds the context budget
                    </span>{" "}
                    — the most relevant files were prioritized for analysis.
                  </p>
                </div>
              </div>
            )}

            <div className="relative mx-auto flex max-w-[1500px]">
              {/* ======================================================
                  LEFT REPOSITORY INTELLIGENCE
              ====================================================== */}

              <ResultSidebar
                result={result}
                sections={sections}
                activeId={activeSection?.id}
                onSelect={setActiveSectionId}
                contextBudgetExceeded={
                  contextBudgetExceeded
                }
              />

              {/* ======================================================
                  MAIN ONBOARDING AREA
              ====================================================== */}

              <div
                className="
                  min-w-0
                  flex-1
                  px-5
                  py-8
                  sm:px-8
                  lg:px-12
                  lg:py-10
                "
                id="guide-content-top"
              >
                {/* Mobile section selector */}
                <select
                  value={activeSection?.id ?? ""}
                  onChange={(event) =>
                    setActiveSectionId(
                      event.target.value,
                    )
                  }
                  className="
                    mb-8
                    w-full
                    rounded-lg
                    border
                    border-white/[0.10]
                    bg-[#0d0b0b]
                    px-3
                    py-2.5
                    text-sm
                    text-zinc-300
                    outline-none
                    lg:hidden
                  "
                >
                  {sections.map((section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.title}
                    </option>
                  ))}
                </select>

                {/* Downward tree map — remounts (and re-plays its trace-in
                    animation) whenever a new repository is analyzed */}
                <OnboardingTree
                  key={result?.repo_url ?? "tree"}
                  sections={sections}
                  activeId={activeSection?.id}
                  onSelect={setActiveSectionId}
                  onNewRepository={handleNewRepository}
                />

                {/* ==================================================
                    SELECTED GUIDE CONTENT
                ================================================== */}

                {activeSection && (
                  <article
                    key={activeSection.id}
                    className="
                      mx-auto
                      mt-10
                      max-w-3xl
                      animate-[fade-in_0.25s_ease]
                    "
                  >
                    <div
                      className="
                        rounded-xl
                        border-2
                        border-white/[0.08]
                        bg-[#0d0b0b]/60
                        px-6
                        py-7
                        shadow-[0_20px_60px_rgba(0,0,0,0.22)]
                        sm:px-8
                        sm:py-8
                      "
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-[var(--font-mono)] text-[10px] tracking-[0.16em] text-zinc-600">
                          SECTION{" "}
                          {String(
                            activeIndex + 1,
                          ).padStart(2, "0")}{" "}
                          /{" "}
                          {String(
                            sections.length,
                          ).padStart(2, "0")}
                        </p>

                        <span className="h-1.5 w-1.5 rounded-full bg-[#9f3434] shadow-[0_0_8px_rgba(159,52,52,0.45)]" />
                      </div>

                      <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em] text-zinc-50 sm:text-[28px]">
                        {activeSection.title}
                      </h2>

                      <div className="mt-7">
                        <GuideSectionBody
                          lines={activeSection.lines}
                        />
                      </div>
                    </div>

                    {/* Previous / Next */}
                    <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-5">
                      <button
                        onClick={() =>
                          goToIndex(
                            activeIndex - 1,
                          )
                        }
                        disabled={
                          activeIndex <= 0
                        }
                        className="
                          group
                          flex
                          max-w-[38%]
                          items-center
                          gap-2
                          text-left
                          text-sm
                          text-zinc-500
                          transition-colors
                          hover:text-zinc-100
                          disabled:cursor-not-allowed
                          disabled:opacity-25
                        "
                      >
                        <span className="text-base transition-transform group-hover:-translate-x-1">
                          ←
                        </span>

                        <span className="truncate">
                          {sections[
                            activeIndex - 1
                          ]?.title ??
                            "Previous"}
                        </span>
                      </button>

                      <span className="shrink-0 font-[var(--font-mono)] text-[10px] text-zinc-700">
                        {activeIndex + 1} /{" "}
                        {sections.length}
                      </span>

                      <button
                        onClick={() =>
                          goToIndex(
                            activeIndex + 1,
                          )
                        }
                        disabled={
                          activeIndex >=
                          sections.length - 1
                        }
                        className="
                          group
                          flex
                          max-w-[38%]
                          items-center
                          gap-2
                          text-right
                          text-sm
                          text-zinc-500
                          transition-colors
                          hover:text-zinc-100
                          disabled:cursor-not-allowed
                          disabled:opacity-25
                        "
                      >
                        <span className="truncate">
                          {sections[
                            activeIndex + 1
                          ]?.title ??
                            "Next"}
                        </span>

                        <span className="text-base transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </button>
                    </div>
                  </article>
                )}
              </div>
            </div>

            {/* ======================================================
                NEW REPOSITORY
            ====================================================== */}
          </div>
        </div>
      )}
    </main>
  )
}

/* =====================================================================
   ONBOARDING TREE
   Connector lines are no longer guessed via a fixed fan-out formula —
   they're drawn from the ACTUAL measured center of the root node and
   every card (getBoundingClientRect), so a branch always lands exactly
   on a card's center point regardless of column count or breakpoint,
   and re-measures on resize so it stays correct responsively.
===================================================================== */

const TRACE_MS = 320 // how long one branch takes to draw
const STEP_GAP_MS = 80 // pause before the next branch starts
const TREE_ACCENT = "#9f3b3b"
const TREE_COLUMNS = 3

function OnboardingTree({
  sections,
  activeId,
  onSelect,
  onNewRepository,
}) {
  const containerRef = useRef(null)
  const rootRef = useRef(null)
  const nodeRefs = useRef([])
  const [connectors, setConnectors] = useState([])
  const [svgSize, setSvgSize] = useState({
    width: 0,
    height: 0,
  })

  useLayoutEffect(() => {
    if (!sections.length) return

    const measure = () => {
      const container = containerRef.current
      const root = rootRef.current

      if (!container || !root) return

      const containerRect =
        container.getBoundingClientRect()

      const rootRect =
        root.getBoundingClientRect()

      const rootPoint = {
        x:
          rootRect.left +
          rootRect.width / 2 -
          containerRect.left,
        y:
          rootRect.bottom -
          containerRect.top,
      }

      const centers = sections.map((_, i) => {
        const el = nodeRefs.current[i]

        if (!el) return null

        const r = el.getBoundingClientRect()

        return {
          x:
            r.left +
            r.width / 2 -
            containerRect.left,

          y:
            r.top +
            r.height / 2 -
            containerRect.top,

          top:
            r.top -
            containerRect.top,
        }
      })

      const step =
        TRACE_MS +
        STEP_GAP_MS

      const next = sections
        .map((_, i) => {
          const to = centers[i]

          if (!to) return null

          // Same column, previous row — chain straight down through
          // every card's center. First row's "previous" is the root.
          const prevIndex =
            i -
            TREE_COLUMNS

          const from =
            prevIndex >= 0
              ? centers[prevIndex]
              : rootPoint

          if (!from) return null

          const d =
            prevIndex >= 0
              ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
              : `M ${from.x} ${from.y} C ${from.x} ${
                  from.y +
                  (to.top - from.y) *
                    0.6
                }, ${to.x} ${
                  from.y +
                  (to.top - from.y) *
                    0.4
                }, ${to.x} ${
                  to.top
                } L ${to.x} ${to.y}`

          return {
            key: i,
            d,
            delay:
              i * step,
          }
        })
        .filter(Boolean)

      setSvgSize({
        width: containerRect.width,
        height: containerRect.height,
      })

      setConnectors(next)
    }

    // Measure once now, once after paint, and once after the fade-in
    // animations settle (their transform can shift layout by a few px).
    measure()

    const raf =
      requestAnimationFrame(measure)

    const settleTimer =
      setTimeout(
        measure,
        sections.length *
          (TRACE_MS +
            STEP_GAP_MS) +
          400,
      )

    const ro =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(
            measure,
          )
        : null

    if (
      ro &&
      containerRef.current
    ) {
      ro.observe(
        containerRef.current,
      )
    }

    window.addEventListener(
      "resize",
      measure,
    )

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(
        settleTimer,
      )
      ro?.disconnect()

      window.removeEventListener(
        "resize",
        measure,
      )
    }
  }, [sections])

  if (!sections.length) return null

  return (
    <section className="mx-auto max-w-4xl">
      <style>{`
        @keyframes root-fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes node-fade-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes trace-line {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* Heading */}
      {/* Heading */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[#a85b5b]">
            Repository Map
          </p>

          <h2 className="mt-2 text-[13px] leading-6 text-zinc-500">
            Follow the generated onboarding path from the project overview.
          </h2>
        </div>

        <button
          type="button"
          onClick={onNewRepository}
          className="
            mt-1
            inline-flex
            shrink-0
            items-center
            gap-2
            rounded-md
            border
            border-[#8a4545]/45
            bg-white/[0.025]
            px-4
            py-2
            text-sm
            font-medium
            text-zinc-400
            shadow-[0_0_16px_rgba(255,255,255,0.02)]
            transition-[border-color,background-color,color,box-shadow]
            duration-200
            hover:border-[#8a4a4a]
            hover:bg-[#3a1518]/50
            hover:text-zinc-100
            hover:shadow-[0_0_20px_rgba(145,32,42,0.10)]
          "
        >
          Analyze New Repo
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex flex-col items-center"
      >
        {/* Root node */}
        <div
          ref={rootRef}
          style={{
            animation:
              "root-fade-in 380ms ease-out both",
          }}
          className="
            relative
            z-10
            rounded-xl
            border
            border-[#7f3f46]/60
            bg-[#0d1118]
            px-6
            py-4
            text-center
            shadow-[0_0_28px_rgba(120,35,35,0.10)]
          "
        >
          <span className="block font-[var(--font-mono)] text-[9px] uppercase tracking-[0.18em] text-[#c9a227]">
            Generated Guide
          </span>

          <span className="mt-1 block text-sm font-medium text-zinc-200">
            Onboarding Guide
          </span>
        </div>

        {/* Traced connectors — sit behind the cards, endpoints are each
            card's real measured center, not a guessed x position */}
        {svgSize.width > 0 && (
          <svg
            width={svgSize.width}
            height={svgSize.height}
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
            className="pointer-events-none absolute left-0 top-0 z-0"
            aria-hidden="true"
          >
            {connectors.map(
              ({
                key,
                d,
                delay,
              }) => (
                <path
                  key={key}
                  d={d}
                  fill="none"
                  stroke={TREE_ACCENT}
                  strokeOpacity="0.75"
                  strokeWidth="1"
                  pathLength="1"
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: `trace-line ${TRACE_MS}ms ease-out ${delay}ms forwards`,
                  }}
                />
              ),
            )}
          </svg>
        )}

        <div className="mt-14 grid w-full grid-cols-1 gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(
            (
              section,
              index,
            ) => (
              <TreeNode
                key={section.id}
                ref={(el) =>
                  (nodeRefs.current[
                    index
                  ] = el)
                }
                section={section}
                index={index}
                active={
                  section.id ===
                  activeId
                }
                onSelect={
                  onSelect
                }
                fadeDelay={
                  index * (TRACE_MS + STEP_GAP_MS) + TRACE_MS
                }
              />
            ),
          )}
        </div>
      </div>
    </section>
  )
}

/* =====================================================================
   TREE NODE
===================================================================== */

const TreeNode = forwardRef(
  function TreeNode(
    {
      section,
      index,
      active,
      onSelect,
      fadeDelay = 0,
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() =>
          onSelect(
            section.id,
          )
        }
        style={{
          opacity: 0,
          animation: `node-fade-in 180ms ease-out ${fadeDelay}ms forwards`,
        }}
        className={`
          group
          relative
          z-10
          min-h-[74px]
          rounded-lg
          border
          px-4
          py-4
          text-left
          transition-[border-color,background-color,transform,box-shadow]
          duration-200
          ${
            active
              ? `
                border-[#8f3b3b]
                bg-[#180d0d]
                shadow-[0_0_20px_rgba(143,59,59,0.12)]
              `
              : `
                border-white/[0.07]
                bg-[#0d0b0b]
                hover:-translate-y-0.5
                hover:border-[#632a2a]
                hover:bg-[#120c0c]
              `
          }
        `}
      >
        {/* Top connector point */}
        <span
          className={`
            absolute
            left-1/2
            top-0
            h-1.5
            w-1.5
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            transition-all
            duration-200
            ${
              active
                ? "bg-[#c9a227] shadow-[0_0_8px_rgba(201,162,39,0.55)]"
                : "bg-[#492020] group-hover:bg-[#7b3434]"
            }
          `}
        />

        <span
          className={`
            block
            font-[var(--font-mono)]
            text-[9px]
            tracking-[0.12em]
            ${
              active
                ? "text-[#c9a227]"
                : "text-zinc-700"
            }
          `}
        >
          {String(
            index + 1,
          ).padStart(
            2,
            "0",
          )}
        </span>

        <span
          className={`
            mt-1
            block
            text-[13px]
            font-medium
            ${
              active
                ? "text-zinc-100"
                : "text-zinc-400 group-hover:text-zinc-200"
            }
          `}
        >
          {section.title}
        </span>

        <span
          className={`
            absolute
            bottom-3
            right-3
            text-[10px]
            transition-transform
            duration-200
            ${
              active
                ? "translate-y-0 text-[#9f4a4a]"
                : "translate-y-1 text-zinc-700 group-hover:translate-y-0 group-hover:text-zinc-500"
            }
          `}
        >
          ↓
        </span>
      </button>
    )
  },
)

export default RepositoryPage