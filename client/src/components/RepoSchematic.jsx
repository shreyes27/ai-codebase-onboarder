import { useEffect, useState } from "react"

const nodes = [
  { id: "root", x: 38, y: 112, label: "repo/", kind: "root" },

  { id: "src", x: 155, y: 50, label: "src/", kind: "dir" },
  { id: "routes", x: 155, y: 112, label: "routes/", kind: "dir" },
  { id: "services", x: 155, y: 170, label: "services/", kind: "dir" },

  { id: "entry", x: 275, y: 35, label: "index.js", kind: "entry" },
  { id: "app", x: 275, y: 72, label: "app.js", kind: "file" },
  { id: "users", x: 275, y: 102, label: "users.js", kind: "file" },
  { id: "auth", x: 275, y: 128, label: "auth.js", kind: "file" },
  { id: "db", x: 275, y: 155, label: "db.js", kind: "file" },
  { id: "mailer", x: 275, y: 188, label: "mailer.js", kind: "file" },
]

const edges = [
  ["root", "src"],
  ["root", "routes"],
  ["root", "services"],
  ["src", "entry"],
  ["src", "app"],
  ["routes", "users"],
  ["routes", "auth"],
  ["services", "db"],
  ["services", "mailer"],
]

const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]))

function RepoSchematic() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 150)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-[500px]">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111112]/40 px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brass)]" />

            <span className="font-[var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-400">
              Repository Map
            </span>
          </div>

          <span className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2 py-0.5 font-[var(--font-mono)] text-[9px] tracking-tight text-zinc-600">
            /structure
          </span>
        </div>

        {/* Visualization */}
        <div className="mt-3.5 overflow-hidden rounded-xl border border-white/[0.06] bg-black/8 p-1">
          <svg
            viewBox="0 0 340 225"
            className="block h-auto w-full overflow-visible"
            role="img"
            aria-label="Repository structure schematic"
          >
            <defs>
              <pattern
                id="repo-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.025)"
                  strokeWidth="1"
                />
              </pattern>

              <filter id="trace-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect
              width="340"
              height="225"
              fill="url(#repo-grid)"
              opacity="0.55"
            />

            
            {/* Slow tracing connections */}
              {edges.map(([fromId, toId], index) => {
                const from = nodeById[fromId]
                const to = nodeById[toId]

                const delay = 0.7 + index * 0.7

                return (
                  <line
                    key={`trace-${fromId}-${toId}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--color-brass)"
                    strokeWidth="1.15"
                    strokeLinecap="round"
                    pathLength="100"
                    style={{
                      strokeDasharray: 100,
                      strokeDashoffset: mounted ? 0 : 100,
                      opacity: mounted ? 0.65 : 0,
                      transition: `
                        stroke-dashoffset 1.6s cubic-bezier(0.65, 0, 0.35, 1) ${delay}s,
                        opacity 0.5s ease ${delay}s
                      `,
                    }}
                  />
                )
              })}

            {/* Nodes */}
            {nodes.map((node, index) => {
              const isEntry = node.kind === "entry"
              const isRoot = node.kind === "root"
              const isDirectory = node.kind === "dir"

              const appearanceDelay =
                node.kind === "file" || node.kind === "entry"
                  ? 2.6 + index * 0.18
                  : 0.7 + index * 0.18

              const nodeColor = isRoot
                ? "var(--color-brass)"
                : isEntry
                  ? "#d8bd63"
                  : isDirectory
                    ? "#b8b8bd"
                    : "#77777e"

              const labelColor = isRoot
                ? "var(--color-brass)"
                : isEntry
                  ? "#b8a35e"
                  : isDirectory
                    ? "#9b9ba1"
                    : "#67676e"

              return (
                <g
                  key={node.id}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted
                      ? "translateY(0)"
                      : "translateY(4px)",
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transition: `
                      opacity 1s cubic-bezier(0.16, 1, 0.3, 1) ${appearanceDelay}s,
                      transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${appearanceDelay}s
                    `,
                  }}
                >
                  {/* Entry point indicator */}
                  
                  {isEntry && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="7"
                      fill="none"
                      stroke="var(--color-brass)"
                      strokeWidth="1"
                      className="entry-glow"
                      style={{
                        opacity: mounted ? 0 : 0,
                        animation: mounted
                          ? "entry-arrival 0.9s ease-out 2.8s forwards"
                          : "none",
                      }}
                    />
                  )}

                  {/* Node */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isRoot ? 4 : isEntry ? 3 : 2.5}
                    fill={
                      isRoot || isEntry
                        ? "var(--color-brass)"
                        : "var(--color-ink)"
                    }
                    stroke={nodeColor}
                    strokeWidth="1.25"
                  />

                  {/* Label */}
                  <text
                    x={
                      isRoot
                        ? node.x - 10
                        : isDirectory
                          ? node.x
                          : node.x + 9
                    }
                    y={
                      isRoot
                        ? node.y + 3.5
                        : isDirectory
                          ? node.y - 8
                          : node.y + 3.5
                    }
                    textAnchor={
                      isRoot
                        ? "end"
                        : isDirectory
                          ? "middle"
                          : "start"
                    }
                    className="font-[var(--font-mono)] text-[9px] font-medium tracking-tight"
                    fill={labelColor}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3.5">
          <span className="text-[10px] text-zinc-600">
            Structure discovered
          </span>

          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brass)]" />

            <span className="font-[var(--font-mono)] text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RepoSchematic