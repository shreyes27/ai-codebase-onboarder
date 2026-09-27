import React, { useEffect, useRef } from "react"

export function RedNebulaBackground({ status = "idle" }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrame
    let width = 0
    let height = 0
    let dpr = 1
    let time = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)

      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr

      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()

    window.addEventListener("resize", resize, {
      passive: true,
    })

    /* ---------------------------------------------------------------
       Draw a very soft atmospheric nebula
    ---------------------------------------------------------------- */

    const drawNebula = (
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      color,
      alpha
    ) => {
      ctx.save()

      ctx.translate(x, y)
      ctx.rotate(rotation)

      const gradient = ctx.createRadialGradient(
        0,
        0,
        radiusX * 0.04,
        0,
        0,
        radiusX
      )

      gradient.addColorStop(
        0,
        `rgba(${color}, ${alpha})`
      )

      gradient.addColorStop(
        0.25,
        `rgba(${color}, ${alpha * 0.65})`
      )

      gradient.addColorStop(
        0.55,
        `rgba(${color}, ${alpha * 0.25})`
      )

      gradient.addColorStop(
        0.82,
        `rgba(${color}, ${alpha * 0.06})`
      )

      gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
      )

      ctx.fillStyle = gradient

      ctx.beginPath()

      ctx.ellipse(
        0,
        0,
        radiusX,
        radiusY,
        0,
        0,
        Math.PI * 2
      )

      ctx.fill()

      ctx.restore()
    }

    /* ---------------------------------------------------------------
       Tiny stars
    ---------------------------------------------------------------- */

    const stars = Array.from(
      { length: 115 },
      (_, index) => {
        const isLeftSide = index % 2 === 0

        return {
          x: isLeftSide
            ? Math.random() * 0.48
            : 0.52 + Math.random() * 0.48,

          y: Math.random(),

          size:
            Math.random() < 0.9
              ? 0.3 + Math.random() * 0.45
              : 0.8 + Math.random() * 0.7,

          opacity:
            0.12 + Math.random() * 0.28,

          phase:
            Math.random() * Math.PI * 2,

          /* Slow left → right movement in pixels */
          speed:
            0.8 +
            Math.random() * 0.7,

          /* Starting horizontal position */
          startX:
            Math.random(),
        }
      }
    )

    /* ---------------------------------------------------------------
       Render
    ---------------------------------------------------------------- */

    const render = () => {
      time += 0.006

      ctx.globalCompositeOperation =
        "source-over"

      /* -------------------------------------------------------------
         Base
      ------------------------------------------------------------- */

      ctx.fillStyle = "#030204"

      ctx.fillRect(
        0,
        0,
        width,
        height
      )

      /* -------------------------------------------------------------
         Very large atmospheric clouds
      ------------------------------------------------------------- */

      ctx.globalCompositeOperation = "screen"

      const activeBoost = 1

      /*
       * Left atmosphere
       */

      drawNebula(
        width * 0.03 +
          Math.sin(time) * 12,
        height * 0.36,
        width * 0.55,
        height * 0.34,
        -0.25,
        "110, 8, 32",
        0.30 * activeBoost
      )

      /*
       * Upper-right atmosphere
       */

      drawNebula(
        width * 0.96 +
          Math.cos(time * 0.8) * 14,
        height * 0.14,
        width * 0.58,
        height * 0.37,
        0.32,
        "150, 10, 38",
        0.38 * activeBoost
      )

      /*
       * Right-side deep cloud
       */

      drawNebula(
        width * 1.03 -
          Math.sin(time * 0.7) * 10,
        height * 0.62,
        width * 0.50,
        height * 0.40,
        -0.38,
        "100, 5, 28",
        0.28 * activeBoost
      )

      /*
       * Bottom-left atmosphere
       */

      drawNebula(
        width * 0.04,
        height * 0.90 +
          Math.cos(time) * 8,
        width * 0.50,
        height * 0.30,
        0.15,
        "90, 5, 25",
        0.22 * activeBoost
      )

      /*
       * Very faint top atmosphere
       */

      drawNebula(
        width * 0.52,
        -height * 0.08,
        width * 0.58,
        height * 0.25,
        0,
        "105, 7, 30",
        0.16
      )

      /* -------------------------------------------------------------
         Fine red haze
      ---------------------------------------------------------------- */

      const haze = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.42,
        Math.max(width, height) * 0.72
      )

      haze.addColorStop(
        0,
        "rgba(60, 4, 18, 0)"
      )

      haze.addColorStop(
        0.42,
        "rgba(80, 5, 22, 0.025)"
      )

      haze.addColorStop(
        0.72,
        "rgba(130, 8, 30, 0.07)"
      )

      haze.addColorStop(
        1,
        "rgba(70, 3, 18, 0.18)"
      )

      ctx.fillStyle = haze

      ctx.fillRect(
        0,
        0,
        width,
        height
      )

      /* -------------------------------------------------------------
         Stars
      ---------------------------------------------------------------- */

      ctx.globalCompositeOperation =
        "screen"

      stars.forEach((star) => {
        const twinkle =
          Math.sin(
            time * 2 +
              star.phase
          ) * 0.18

        ctx.globalAlpha =
          Math.max(
            0.04,
            star.opacity + twinkle
          )

        ctx.fillStyle = "#f6dfe3"

        /*
         * Very slow left → right revolving drift.
         * The modulo keeps stars continuously circulating
         * through the canvas without accumulating position.
         */
        /*
        * Slow continuous left → right movement.
        * Pixel-based speed makes the motion visible even
        * when the canvas is large.
        */
        const driftX =
          (
            star.x * width +
            time * star.speed * 16
          ) % width

        /*
        * Extremely subtle vertical arc so stars don't
        * feel like they're moving on perfectly straight rails.
        */
        const driftY =
          star.y * height +
          Math.sin(
            time * 0.45 +
              star.phase
          ) * 2.5
        ctx.beginPath()

        ctx.arc(
          driftX,
          driftY,
          star.size,
          0,
          Math.PI * 2
        )

        ctx.fill()
      })

      /* -------------------------------------------------------------
         Keep the central working area quiet
      ---------------------------------------------------------------- */

      ctx.globalCompositeOperation =
        "source-over"

      const centerProtection =
        ctx.createRadialGradient(
          width * 0.5,
          height * 0.45,
          Math.min(width, height) * 0.05,
          width * 0.5,
          height * 0.45,
          Math.min(width, height) * 0.48
        )

      centerProtection.addColorStop(
        0,
        "rgba(3, 2, 4, 0.88)"
      )

      centerProtection.addColorStop(
        0.38,
        "rgba(3, 2, 4, 0.68)"
      )

      centerProtection.addColorStop(
        0.68,
        "rgba(3, 2, 4, 0.20)"
      )

      centerProtection.addColorStop(
        1,
        "rgba(3, 2, 4, 0)"
      )

      ctx.fillStyle = centerProtection

      ctx.fillRect(
        0,
        0,
        width,
        height
      )

      /* -------------------------------------------------------------
         Cinematic vignette
      ---------------------------------------------------------------- */

      const vignette =
        ctx.createRadialGradient(
          width / 2,
          height / 2,
          Math.min(width, height) * 0.22,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.76
        )

      vignette.addColorStop(
        0,
        "rgba(0,0,0,0)"
      )

      vignette.addColorStop(
        0.62,
        "rgba(0,0,0,0.08)"
      )

      vignette.addColorStop(
        0.84,
        "rgba(0,0,0,0.48)"
      )

      vignette.addColorStop(
        1,
        "rgba(0,0,0,0.88)"
      )

      ctx.fillStyle = vignette

      ctx.fillRect(
        0,
        0,
        width,
        height
      )

      animationFrame =
        requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrame)

      window.removeEventListener(
        "resize",
        resize
      )
    }
  }, [])

  return (
    <div
      className="
        fixed
        inset-x-0
        top-[62px]
        bottom-0
        z-0
        overflow-hidden
        pointer-events-none
        bg-[#030204]
      "
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="
          absolute
          inset-0
          h-full
          w-full
        "
      />

      {/* Very subtle film grain */}

      <div
        className="
          absolute
          inset-0
          opacity-[0.012]
          mix-blend-screen
        "
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}

/* =====================================================================
   ANALYSIS VISUAL
===================================================================== */

export default function AnalysisVisual({
  status = "idle",
  children,
  readingCard,
  className = "",
}) {
  const isAnalyzing =
    status === "loading" ||
    status === "analyzing"

  const isSuccess =
    status === "success"

  return (
    <div
      className={`
        relative
        mx-auto
        flex
        w-full
        max-w-[1180px]
        flex-col
        items-center
        overflow-hidden
        ${className}
      `}
    >
      {/* =============================================================
          Background
      ============================================================= */}

      <RedNebulaBackground
        status={status}
      />

      {/* =============================================================
          Main Analyze Card Area
      ============================================================= */}

      <div
        className="
          relative
          z-10
          h-[440px]
          w-full
          sm:h-[480px]
          lg:h-[500px]
        "
      >
        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
          "
        >
          <div
            className="
              relative
              z-10
              w-[calc(100%-40px)]
              max-w-[560px]
            "
          >
            {children}
          </div>
        </div>

        {/* Success connector */}

        {isSuccess && (
          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[calc(50%+30px)]
              h-[75px]
              w-px
              -translate-x-1/2
              bg-[#ef4444]/60
              shadow-[0_0_14px_rgba(239,68,68,0.35)]
            "
          />
        )}
      </div>

      {/* =============================================================
          Convergence Pipeline
      ============================================================= */}

      {isAnalyzing && (
        <div
          className="
            relative
            z-10
            -mt-1
            flex
            h-[18px]
            w-full
            items-start
            justify-center
          "
        >
          <svg
            className="
              h-[78px]
              w-full
              max-w-[360px]
              -translate-y-29
            "
            viewBox="0 0 360 78"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Base pipeline — LEFT */}

            <path
              d="M78 0C125 20 145 48 166 78"
              stroke={
                isAnalyzing
                  ? "#991b1b"
                  : "#320707"
              }
              strokeWidth={
                isAnalyzing ? 1.8 : 1
              }
              opacity={
                isAnalyzing ? 0.9 : 0.35
              }
            />

            {/* Base pipeline — CENTER */}

            <path
              d="M180 0V78"
              stroke={
                isAnalyzing
                  ? "#b91c1c"
                  : "#450a0a"
              }
              strokeWidth={
                isAnalyzing ? 2 : 1
              }
              opacity={
                isAnalyzing ? 0.95 : 0.38
              }
            />

            {/* Base pipeline — RIGHT */}

            <path
              d="M282 0C235 20 215 48 194 78"
              stroke={
                isAnalyzing
                  ? "#991b1b"
                  : "#320707"
              }
              strokeWidth={
                isAnalyzing ? 1.8 : 1
              }
              opacity={
                isAnalyzing ? 0.9 : 0.35
              }
            />

            {/* DOWNWARD FLOW — LEFT */}

            {isAnalyzing && (
              <path
                d="M78 0C125 20 145 48 166 78"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 15"
                className="pipeline-flow pipeline-flow-left"
              />
            )}

            {/* DOWNWARD FLOW — CENTER */}

            {isAnalyzing && (
              <path
                d="M180 0V78"
                stroke="#ef4444"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="3 15"
                className="pipeline-flow pipeline-flow-center"
              />
            )}

            {/* DOWNWARD FLOW — RIGHT */}

            {isAnalyzing && (
              <path
                d="M282 0C235 20 215 48 194 78"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 15"
                className="pipeline-flow pipeline-flow-right"
              />
            )}
          </svg>
        </div>
      )}

      {/* =============================================================
          Reading Repository Card
      ============================================================= */}

      {isAnalyzing && (
        <div
          className="
            relative
            z-10
            -translate-y-14
            w-[calc(100%-40px)]
            max-w-[560px]
            transition-all
            duration-700
          "
        >
          {readingCard ?? (
            <div
              className="
                relative
                overflow-hidden
                border
                border-[#542323]/55
                bg-[#090608]/92
                shadow-[0_18px_70px_rgba(0,0,0,0.42)]
                backdrop-blur-[2px]
              "
            >
              {/* Top scanning line */}

              <div
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  overflow-hidden
                  bg-[#241313]
                "
              >
                <div
                  className="h-full w-[28%] bg-[#9f3434]"
                  style={{
                    animation:
                      isAnalyzing
                        ? "loadingSweep 1.8s ease-in-out infinite"
                        : "none",
                  }}
                />
              </div>

              <div
                className="
                  px-6
                  py-5
                  sm:px-7
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span
                    className="
                      relative
                      flex
                      h-2
                      w-2
                    "
                  >
                    <span
                      className="
                        absolute
                        inline-flex
                        h-full
                        w-full
                        animate-ping
                        rounded-full
                        bg-[#7f3030]
                        opacity-40
                      "
                    />

                    <span
                      className="
                        relative
                        inline-flex
                        h-2
                        w-2
                        rounded-full
                        bg-[#a04444]
                      "
                    />
                  </span>

                  <div>
                    <p
                      className="
                        text-sm
                        font-medium
                        tracking-[-0.01em]
                        text-zinc-300
                      "
                    >
                      Reading repository
                    </p>

                    <p
                      className="
                        mt-1
                        text-[12px]
                        leading-relaxed
                        text-zinc-600
                      "
                    >
                      Scanning structure, entry
                      points, modules and
                      dependencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}