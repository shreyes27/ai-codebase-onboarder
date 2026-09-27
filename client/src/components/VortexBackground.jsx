import { useEffect, useRef } from "react"

// ------------------------------------------------------------
// CELESTIAL PALETTE
// ------------------------------------------------------------

const PALETTE = {
  white: "250, 252, 255",
  silver: "215, 222, 235",

  gold: "255, 215, 110",
  brass: "245, 185, 65",

  cyan: "35, 215, 245",
  electricBlue: "65, 125, 255",

  violet: "155, 75, 255",
  magenta: "235, 65, 145",

  deepIndigo: "70, 40, 160",
  red: "205, 60, 75",
}

const NEBULA_COLORS = [
  PALETTE.deepIndigo,
  PALETTE.violet,
  PALETTE.magenta,
  PALETTE.electricBlue,
  PALETTE.cyan,
  PALETTE.red,
]

// How far the whole vortex leans from top-right to bottom-left,
// as a fraction of canvas width.
const DRIFT_RATIO = 0.26

// How much of the top/bottom of the travel path is used to fade
// particles in/out, so the t=1 -> t=0 wrap is invisible.
const EDGE_FADE_ZONE = 0.09

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

// Smoothly fades a particle in near the start of its cycle
// and out near the end.
function edgeFade(t, zone = EDGE_FADE_ZONE) {
  const fadeIn = t / zone
  const fadeOut = (1 - t) / zone

  return Math.max(0, Math.min(1, fadeIn, fadeOut))
}

// The horizontal center of the vortex at a given point along
// its length. Shifts steadily from right to left as t increases.
function vortexCenterX(t, width, baseX) {
  return baseX + width * DRIFT_RATIO * (0.5 - t)
}

// ------------------------------------------------------------
// STAR COLOR
// ------------------------------------------------------------

function pickStarColor() {
  const r = Math.random()

  if (r < 0.035) return PALETTE.gold
  if (r < 0.09) return PALETTE.cyan
  if (r < 0.15) return PALETTE.electricBlue
  if (r < 0.23) return PALETTE.brass
  if (r < 0.58) return PALETTE.silver

  return PALETTE.white
}

// ------------------------------------------------------------
// AMBIENT STARS
// ------------------------------------------------------------

function createStar(width) {
  return {
    t: Math.random(),

    fallSpeed: randomRange(0.012, 0.03),

    baseAngle: Math.random() * Math.PI * 2,

    spiralTwist: randomRange(1.1, 2.4),

    radialOffset: randomRange(0.68, 1.12),

    eccentricity: randomRange(0.82, 1.18),

    depth: Math.random(),

    jitterX: (Math.random() - 0.5) * width * 0.04,

    size: randomRange(0.45, 1.55),

    baseOpacity: randomRange(0.24, 0.82),

    twinklePhase: Math.random() * Math.PI * 2,

    twinkleSpeed: randomRange(0.25, 0.9),

    color: pickStarColor(),

    prismatic: Math.random() < 0.035,
  }
}

// ------------------------------------------------------------
// NEBULA CLOUDS
// ------------------------------------------------------------

function createNebula(width, height) {
  return {
    x: Math.random() * width,

    y: Math.random() * height,

    radius: Math.min(width, height) * randomRange(0.24, 0.52),

    color:
      NEBULA_COLORS[
        Math.floor(Math.random() * NEBULA_COLORS.length)
      ],

    opacity: randomRange(0.018, 0.04),

    driftPhase: Math.random() * Math.PI * 2,

    driftSpeed: randomRange(0.006, 0.015),

    driftRadius: randomRange(12, 38),

    stretchX: randomRange(0.7, 1.55),

    stretchY: randomRange(0.65, 1.25),

    sprite: null,
  }
}

// ------------------------------------------------------------
// COSMIC DUST
// ------------------------------------------------------------

function createDust() {
  return {
    t: Math.random(),

    angle: Math.random() * Math.PI * 2,

    radial: randomRange(0.12, 0.55),

    depth: Math.random(),

    spin: randomRange(0.04, 0.14),

    fallSpeed: randomRange(0.004, 0.012),

    size: randomRange(0.25, 1.15),

    opacity: randomRange(0.05, 0.24),

    turbulencePhase: Math.random() * Math.PI * 2,

    turbulenceSpeed: randomRange(0.1, 0.25),

    color:
      Math.random() < 0.12
        ? PALETTE.cyan
        : Math.random() < 0.2
          ? PALETTE.brass
          : Math.random() < 0.16
            ? PALETTE.electricBlue
            : PALETTE.silver,
  }
}

// ------------------------------------------------------------
// MAIN VORTEX PARTICLES
// ------------------------------------------------------------

function createVortexParticle() {
  return {
    t: Math.random(),

    angle: Math.random() * Math.PI * 2,

    depth: Math.random(),

    fallSpeed: randomRange(0.008, 0.02),

    spinSpeed: randomRange(0.18, 0.4),

    size: randomRange(0.45, 1.7),

    turbulencePhase: Math.random() * Math.PI * 2,

    turbulenceSpeed: randomRange(0.12, 0.3),

    color: pickStarColor(),

    bright: Math.random() < 0.055,

    trail: Math.random() < 0.1,

    previousX: 0,

    previousY: 0,

    initialized: false,
  }
}

// ------------------------------------------------------------
// VORTEX SHAPE
// ------------------------------------------------------------

function vortexProfile(t) {
  const distance = Math.abs(t - 0.5) * 2

  const throat = 0.13

  const base =
    throat +
    (1 - throat) * Math.pow(distance, 1.58)

  const naturalWave =
    1 + Math.sin(t * Math.PI * 3.2) * 0.045

  return base * naturalWave
}

// ------------------------------------------------------------
// ORGANIC TURBULENCE
// ------------------------------------------------------------

function turbulence(phase, time, strength) {
  return (
    Math.sin(phase + time * 0.72) * strength +
    Math.sin(phase * 1.73 + time * 0.37) *
      strength *
      0.42
  )
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

export default function VortexBackground() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    })

    if (!ctx) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    let width = 0
    let height = 0
    let dpr = 1

    let stars = []
    let nebulas = []
    let dust = []
    let vortexParticles = []

    let elapsed = 0
    let lastTime = performance.now()

    let pageVisible = !document.hidden
    let inViewport = true

    // ----------------------------------------------------------
    // RESPONSIVE COUNTS
    // ----------------------------------------------------------

    function getCounts() {
      const screenWidth = window.innerWidth

      if (screenWidth < 640) {
        return {
          stars: 120,
          nebulas: 2,
          dust: 45,
          vortex: 80,
        }
      }

      if (screenWidth < 1024) {
        return {
          stars: 210,
          nebulas: 3,
          dust: 70,
          vortex: 120,
        }
      }

      return {
        stars: 320,
        nebulas: 4,
        dust: 110,
        vortex: 180,
      }
    }

    // ----------------------------------------------------------
    // CANVAS SIZE
    // ----------------------------------------------------------

    function resizeCanvas() {
      const parent = canvas.parentElement

      if (!parent) return

      width = parent.clientWidth
      height = parent.clientHeight

      dpr = Math.min(window.devicePixelRatio || 1, 1.5)

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)

      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // ----------------------------------------------------------
    // CREATE NEBULA SPRITE
    // ----------------------------------------------------------

    function createNebulaSprite(nebula) {
      const size = Math.ceil(nebula.radius * 2)

      const sprite = document.createElement("canvas")
      const spriteCtx = sprite.getContext("2d")

      if (!spriteCtx) return null

      sprite.width = size
      sprite.height = size

      const center = size * 0.5

      const gradient = spriteCtx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        nebula.radius
      )

      gradient.addColorStop(
        0,
        `rgba(${nebula.color}, ${nebula.opacity * 1.25})`
      )

      gradient.addColorStop(
        0.28,
        `rgba(${nebula.color}, ${nebula.opacity * 0.72})`
      )

      gradient.addColorStop(
        0.58,
        `rgba(${nebula.color}, ${nebula.opacity * 0.3})`
      )

      gradient.addColorStop(
        1,
        `rgba(${nebula.color}, 0)`
      )

      spriteCtx.fillStyle = gradient
      spriteCtx.fillRect(0, 0, size, size)

      return sprite
    }

    // ----------------------------------------------------------
    // SCENE INITIALIZATION
    // ----------------------------------------------------------

    function initScene() {
      const counts = getCounts()

      stars = Array.from(
        { length: counts.stars },
        () => createStar(width)
      )

      nebulas = Array.from(
        { length: counts.nebulas },
        () => {
          const nebula = createNebula(width, height)

          nebula.sprite =
            createNebulaSprite(nebula)

          return nebula
        }
      )

      dust = Array.from(
        { length: counts.dust },
        () => createDust()
      )

      vortexParticles = Array.from(
        { length: counts.vortex },
        () => createVortexParticle()
      )
    }

    resizeCanvas()
    initScene()

    // ----------------------------------------------------------
    // 1. NEBULA / COSMIC GAS
    // ----------------------------------------------------------

    function drawNebulae() {
      ctx.save()

      ctx.globalCompositeOperation = "screen"

      for (const nebula of nebulas) {
        if (!nebula.sprite) continue

        const driftX =
          Math.cos(
            nebula.driftPhase +
              elapsed * nebula.driftSpeed
          ) * nebula.driftRadius

        const driftY =
          Math.sin(
            nebula.driftPhase * 1.27 +
              elapsed * nebula.driftSpeed
          ) * nebula.driftRadius

        const x = nebula.x + driftX
        const y = nebula.y + driftY
        const size = nebula.radius * 2

        ctx.save()

        ctx.translate(x, y)

        ctx.rotate(nebula.driftPhase)

        ctx.scale(
          nebula.stretchX,
          nebula.stretchY
        )

        ctx.drawImage(
          nebula.sprite,
          -size * 0.5,
          -size * 0.5
        )

        ctx.restore()
      }

      ctx.restore()
    }

    // ----------------------------------------------------------
    // 2. AMBIENT STARFIELD
    // ----------------------------------------------------------

    function drawStars(dt) {
      const vortexBaseX = width * 0.48

      const vortexTop = height * 0.015

      const vortexHeight = height * 0.97

      const maxRadius = Math.min(
        width * 0.41,
        height * 0.44
      )

      const motionMultiplier =
        reducedMotion ? 0.08 : 1

      for (const star of stars) {
        star.t +=
          star.fallSpeed *
          dt *
          motionMultiplier

        if (star.t >= 1) {
          star.t -= 1
        }

        const t = star.t

        const profile = vortexProfile(t)

        const streamAngle =
          star.baseAngle +
          t * star.spiralTwist

        const vortexRadius =
          maxRadius *
          profile *
          star.radialOffset

        const centerX =
          vortexCenterX(
            t,
            width,
            vortexBaseX
          )

        const turbulenceAmount =
          turbulence(
            star.twinklePhase,
            elapsed,
            1.4 +
              star.depth * 2.2
          )

        const x =
          centerX +
          star.jitterX +
          Math.cos(streamAngle) *
            vortexRadius *
            star.eccentricity +
          turbulenceAmount

        const y =
          vortexTop +
          t * vortexHeight

        const twinkle =
          0.78 +
          Math.sin(
            star.twinklePhase +
              elapsed *
                star.twinkleSpeed
          ) *
            0.22

        const opacity =
          star.baseOpacity *
          twinkle *
          edgeFade(t)

        if (opacity <= 0.004) continue

        ctx.beginPath()

        ctx.fillStyle =
          `rgba(${star.color}, ${opacity})`

        ctx.arc(
          x,
          y,
          star.size,
          0,
          Math.PI * 2
        )

        ctx.fill()

        if (
          star.prismatic &&
          opacity > 0.62
        ) {
          const spike =
            star.size * 3

          ctx.beginPath()

          ctx.strokeStyle =
            `rgba(${star.color}, ${opacity * 0.28})`

          ctx.lineWidth = 0.4

          ctx.moveTo(
            x - spike,
            y
          )

          ctx.lineTo(
            x + spike,
            y
          )

          ctx.moveTo(
            x,
            y - spike
          )

          ctx.lineTo(
            x,
            y + spike
          )

          ctx.stroke()
        }
      }
    }

    // ----------------------------------------------------------
    // 3. COSMIC DUST
    // ----------------------------------------------------------

    function drawDust(
      vortexBaseX,
      vortexTop,
      vortexHeight,
      maxRadius,
      dt
    ) {
      ctx.save()

      ctx.globalCompositeOperation =
        "screen"

      const motionMultiplier =
        reducedMotion ? 0.1 : 1

      for (const particle of dust) {
        particle.t +=
          particle.fallSpeed *
          dt *
          motionMultiplier

        if (particle.t >= 1) {
          particle.t -= 1
        }

        const t = particle.t

        const profile =
          vortexProfile(t)

        particle.angle +=
          particle.spin *
          dt *
          (0.7 + profile)

        const spiralAngle =
          particle.angle +
          profile * 2.8

        const radialDistance =
          maxRadius *
          particle.radial *
          (0.58 + profile * 0.95)

        const turbulenceAmount =
          turbulence(
            particle.turbulencePhase,
            elapsed *
              particle.turbulenceSpeed,
            5 +
              particle.depth * 8
          )

        const centerX =
          vortexCenterX(
            t,
            width,
            vortexBaseX
          )

        const x =
          centerX +
          Math.cos(spiralAngle) *
            (radialDistance +
              turbulenceAmount)

        const y =
          vortexTop +
          t * vortexHeight

        const perspective =
          0.45 +
          particle.depth * 0.9

        const size =
          particle.size *
          perspective

        const opacity =
          particle.opacity *
          perspective *
          edgeFade(t)

        if (opacity <= 0.004) continue

        ctx.beginPath()

        ctx.fillStyle =
          `rgba(${particle.color}, ${opacity})`

        ctx.arc(
          x,
          y,
          Math.max(0.2, size),
          0,
          Math.PI * 2
        )

        ctx.fill()
      }

      ctx.restore()
    }

    // ----------------------------------------------------------
    // 4. MAIN COSMIC VORTEX
    // ----------------------------------------------------------

    function drawVortex(
      vortexBaseX,
      vortexTop,
      vortexHeight,
      maxRadius,
      dt
    ) {
      ctx.save()

      ctx.globalCompositeOperation =
        "lighter"

      const motionMultiplier =
        reducedMotion ? 0.1 : 1

      for (
        let i = 0;
        i < vortexParticles.length;
        i++
      ) {
        const particle =
          vortexParticles[i]

        const profile =
          vortexProfile(
            particle.t
          )

        const angularVelocity =
          (0.62 /
            (profile + 0.16)) *
          particle.spinSpeed

        particle.angle +=
          angularVelocity *
          dt *
          motionMultiplier

        particle.t +=
          particle.fallSpeed *
          dt *
          (reducedMotion
            ? 0.15
            : 1)

        if (particle.t >= 1) {
          const carryOver =
            particle.t - 1

          Object.assign(
            particle,
            createVortexParticle()
          )

          particle.t = carryOver
          particle.initialized =
            false
        }

        const t = particle.t

        const radius =
          maxRadius *
          profile *
          (0.46 +
            particle.depth *
              0.68)

        const turbulenceAmount =
          turbulence(
            particle.turbulencePhase,
            elapsed *
              particle.turbulenceSpeed,
            1.5 +
              particle.depth * 5
          )

        const centerX =
          vortexCenterX(
            t,
            width,
            vortexBaseX
          )

        const x =
          centerX +
          Math.cos(
            particle.angle
          ) *
            radius +
          turbulenceAmount

        const y =
          vortexTop +
          t * vortexHeight

        const perspective =
          0.48 +
          particle.depth * 1.05

        const size =
          particle.size *
          perspective

        const opacity =
          (0.14 +
            particle.depth * 0.52) *
          edgeFade(t)

        if (opacity <= 0.004) {
          particle.previousX = x
          particle.previousY = y
          particle.initialized =
            true

          continue
        }

        if (
          particle.trail &&
          particle.initialized
        ) {
          ctx.beginPath()

          ctx.strokeStyle =
            `rgba(${particle.color}, ${opacity * 0.12})`

          ctx.lineWidth = 0.35

          ctx.moveTo(
            particle.previousX,
            particle.previousY
          )

          ctx.lineTo(x, y)

          ctx.stroke()
        }

        particle.previousX = x
        particle.previousY = y
        particle.initialized = true

        ctx.beginPath()

        ctx.fillStyle =
          `rgba(${particle.color}, ${opacity})`

        ctx.arc(
          x,
          y,
          Math.max(
            0.35,
            size *
              (0.4 +
                particle.depth * 0.3)
          ),
          0,
          Math.PI * 2
        )

        ctx.fill()

        if (particle.bright) {
          const sparkle =
            Math.sin(
              elapsed * 1.2 +
                particle.turbulencePhase
            )

          if (sparkle > 0.72) {
            const length =
              2 + sparkle * 3

            ctx.beginPath()

            ctx.strokeStyle =
              `rgba(${particle.color}, ${opacity * 0.24})`

            ctx.lineWidth = 0.4

            ctx.moveTo(
              x - length,
              y
            )

            ctx.lineTo(
              x + length,
              y
            )

            ctx.moveTo(
              x,
              y - length
            )

            ctx.lineTo(
              x,
              y + length
            )

            ctx.stroke()
          }
        }
      }

      ctx.restore()
    }

    // ----------------------------------------------------------
    // ANIMATION
    // ----------------------------------------------------------

    function animate(now) {
      if (
        !pageVisible ||
        !inViewport
      ) {
        rafRef.current = null
        return
      }

      const dt =
        Math.min(
          now - lastTime,
          50
        ) / 1000

      lastTime = now

      elapsed += dt

      ctx.clearRect(
        0,
        0,
        width,
        height
      )

      const vortexX =
        width * 0.48

      const vortexTop =
        height * 0.015

      const vortexHeight =
        height * 0.97

      const maxRadius =
        Math.min(
          width * 0.41,
          height * 0.44
        )

      drawNebulae()

      drawStars(dt)

      drawDust(
        vortexX,
        vortexTop,
        vortexHeight,
        maxRadius,
        dt
      )

      drawVortex(
        vortexX,
        vortexTop,
        vortexHeight,
        maxRadius,
        dt
      )

      rafRef.current =
        requestAnimationFrame(
          animate
        )
    }

    function startAnimation() {
      if (
        rafRef.current !== null ||
        !pageVisible ||
        !inViewport
      ) {
        return
      }

      lastTime =
        performance.now()

      rafRef.current =
        requestAnimationFrame(
          animate
        )
    }

    // ----------------------------------------------------------
    // PAGE VISIBILITY
    // ----------------------------------------------------------

    function handleVisibilityChange() {
      pageVisible =
        !document.hidden

      if (pageVisible) {
        startAnimation()
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    )

    // ----------------------------------------------------------
    // VIEWPORT VISIBILITY
    // ----------------------------------------------------------

    const intersectionObserver =
      new IntersectionObserver(
        ([entry]) => {
          inViewport =
            entry.isIntersecting

          if (inViewport) {
            startAnimation()
          }
        },
        {
          threshold: 0.01,
        }
      )

    intersectionObserver.observe(
      canvas
    )

    // ----------------------------------------------------------
    // RESPONSIVE RESIZE
    // ----------------------------------------------------------

    const resizeObserver =
      new ResizeObserver(() => {
        resizeCanvas()
        initScene()
      })

    const parent =
      canvas.parentElement

    if (parent) {
      resizeObserver.observe(parent)
    }

    startAnimation()

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )

      intersectionObserver.disconnect()

      resizeObserver.disconnect()

      if (
        rafRef.current !== null
      ) {
        cancelAnimationFrame(
          rafRef.current
        )

        rafRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  )
}