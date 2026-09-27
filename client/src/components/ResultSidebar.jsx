function ResultSidebar({
  result,
  sections,
  activeId,
  onSelect,
  contextBudgetExceeded,
}) {
  const analysis = result?.analysis_summary ?? {}
  const projectInfo = result?.project_info ?? {}
  const relevantFiles =
    result?.relevant_files ??
    result?.relevant_file_paths ??
    []
  const entryPoints =
    result?.entry_points ??
    []

  return (
    <>
      {/* Full-height background/border fill */}
      <div
        className="absolute inset-y-0 left-0 z-0 hidden w-[280px] border-r-2 border-white/[0.10] bg-[#090707] lg:block"
        style={{
          transform:
            "translateX(min(0px, calc((1500px - 100vw) / 2)))",
        }}
        aria-hidden="true"
      />

      {/* The real sidebar */}
      <aside
        className="
          sticky
          top-0
          z-10
          hidden
          w-[280px]
          shrink-0
          self-start
          bg-transparent
          antialiased
          lg:block
        "
        style={{
          transform:
            "translateX(min(0px, calc((1500px - 100vw) / 2)))",
        }}
      >
        <div
  className="px-6 py-6"
  style={{
    transform:
      "translateX(calc(max(0px, (100vw - 1500px) / 2) - 12px))",
  }}
>
          {/* Header */}
          <div>
            <p className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.18em] text-[#c9a227]">
              Repository Intelligence
            </p>

            <h2 className="mt-3 text-[15px] font-semibold text-zinc-100">
              {getRepositoryName(result?.repo_url)}
            </h2>

            <p className="mt-1 truncate font-[var(--font-mono)] text-[10px] text-zinc-500">
              {result?.repo_url ?? "Repository"}
            </p>
          </div>

          {/* Project detection */}
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Detected stack
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                projectInfo.language,
                projectInfo.framework,
                projectInfo.runtime,
                result?.repository_type,
              ]
                .filter(Boolean)
                .map((item) => (
                  <span
                    key={item}
                    className="
                      rounded-md
                      border
                      border-[#4b2424]/70
                      bg-[#120b0b]
                      px-2
                      py-1
                      text-[10px]
                      font-medium
                      text-zinc-300
                    "
                  >
                    {String(item).replace(/_/g, " ")}
                  </span>
                ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06]">
            <SidebarStat
              label="Files"
              value={analysis.total_files}
            />

            <SidebarStat
              label="Relevant"
              value={analysis.relevant_files}
            />

            <SidebarStat
              label="Modules"
              value={analysis.modules_analyzed}
            />

            <SidebarStat
              label="Entry points"
              value={analysis.entry_points}
            />
          </div>

          {/* Context notice */}
          {contextBudgetExceeded && (
            <div className="mt-4 rounded-lg border border-[#4c2020]/60 bg-[#110808] p-3">
              <div className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9524f]" />

                <p className="text-[10px] leading-5 text-zinc-400">
                  Large repository. Relevant files were prioritized
                  before generating the guide.
                </p>
              </div>
            </div>
          )}

          {/* Guide sections */}
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                Guide sections
              </p>

              <span className="font-[var(--font-mono)] text-[10px] text-zinc-500">
                {sections.length}
              </span>
            </div>

            <div className="mt-3 space-y-1">
              {sections.map((section, index) => {
                const active = section.id === activeId

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      onSelect(section.id)

                      requestAnimationFrame(() => {
                        document
                          .getElementById("guide-content-top")
                          ?.scrollIntoView({
                            block: "start",
                            behavior: "smooth",
                          })
                      })
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      gap-2.5
                      rounded-md
                      border-l-2
                      px-2.5
                      py-2
                      text-left
                      transition-colors
                      duration-150
                      ${
                        active
                          ? "border-[#c9a227]/70 bg-[#160b0b] text-zinc-50"
                          : "border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                      }
                    `}
                  >
                    <span
                      className={`
                        h-1
                        w-1
                        shrink-0
                        rounded-full
                        ${
                          active
                            ? "bg-[#c9524f] shadow-[0_0_6px_rgba(201,82,79,0.6)]"
                            : "bg-zinc-600"
                        }
                      `}
                    />

                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium">
                      {section.title}
                    </span>

                    <span className="font-[var(--font-mono)] text-[9px] text-zinc-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Relevant files */}
          {Array.isArray(relevantFiles) &&
            relevantFiles.length > 0 && (
              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                    Relevant files
                  </p>

                  <span className="font-[var(--font-mono)] text-[9px] text-zinc-500">
                    {relevantFiles.length}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {relevantFiles
                    .slice(0, 8)
                    .map((file) => {
                      const path =
                        typeof file === "string"
                          ? file
                          : file?.path ??
                            file?.file_path ??
                            ""

                      if (!path) return null

                      return (
                        <div
                          key={path}
                          title={path}
                          className="
                            truncate
                            rounded-md
                            border
                            border-white/[0.06]
                            bg-white/[0.03]
                            px-2.5
                            py-2
                            font-[var(--font-mono)]
                            text-[9px]
                            text-zinc-400
                          "
                        >
                          {path}
                        </div>
                      )
                    })}
                </div>

                {relevantFiles.length > 8 && (
                  <p className="mt-2 text-[9px] text-zinc-500">
                    + {relevantFiles.length - 8} more relevant files
                  </p>
                )}
              </div>
            )}

          {/* Validation */}
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
              Generation
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${
                    result?.validation?.has_warnings
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }
                `}
              />

              <span className="text-[12px] font-medium text-zinc-300">
                {result?.validation?.has_warnings
                  ? "Flagged claims"
                  : "Fully grounded"}
              </span>
            </div>

            {result?.provider && (
              <p className="mt-2 font-[var(--font-mono)] text-[10px] text-zinc-500">
                {result.provider}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarStat({ label, value }) {
  return (
    <div className="bg-[#0d0b0b] px-3 py-3">
      <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>

      <p className="mt-1 font-[var(--font-mono)] text-sm font-medium text-zinc-200">
        {value ?? "—"}
      </p>
    </div>
  )
}

function getRepositoryName(url) {
  if (!url) return "Repository"

  try {
    const clean = url.replace(/\/+$/, "")

    return (
      clean.split("/").pop() ||
      "Repository"
    )
  } catch {
    return "Repository"
  }
}

export default ResultSidebar