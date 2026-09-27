import React from "react";
import robo1 from "../assets/robo1.webp";

/**
 * Green
 * -----------------------------------------------------------------
 * Section-scoped ambient background — simple, professional, fully
 * filled (no dead/empty patches), ice-green premium palette.
 *
 * Layers (back to front):
 *   1. One continuous gradient across the full height — dark near
 *      the top (iceberg zone stays low-light) lifting to a richer
 *      emerald tone in the middle, settling back down toward the
 *      bottom.
 *   2. A soft radial vignette for depth.
 *   3. A very low-opacity film-grain texture so the gradient doesn't
 *      read as a flat color fill.
 *   4. A faint full-area grid for quiet structure.
 *   5. Several soft blurred glow blobs, spread across the *entire*
 *      area (not just corners) so no region looks empty.
 *   6. Three large, soft "ridge" waves stacked toward the bottom,
 *      filling the lower portion of the page with gentle shape
 *      instead of leaving it blank.
 *
 * Section-scoped (fills nearest relative parent), pointer-events-none,
 * safe from navbar leakage, pure SVG/CSS — lightweight.
 * -----------------------------------------------------------------
 */

const GLOW_BLOBS = [
  { top: "8%", left: "6%", size: 460, color: "16,185,129", op: 0.08 },
  { top: "4%", left: "68%", size: 520, color: "45,212,191", op: 0.07 },
  { top: "34%", left: "38%", size: 600, color: "52,211,153", op: 0.07 },
  { top: "40%", left: "82%", size: 480, color: "20,184,166", op: 0.08 },
  { top: "66%", left: "10%", size: 540, color: "16,185,129", op: 0.07 },
  { top: "72%", left: "62%", size: 620, color: "45,212,191", op: 0.08 },
];

export function Green() {
  return (
    <div className="green-bg" aria-hidden="true">
      <style>{`
        .green-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          isolation: isolate;
        }

        /* Continuous premium base gradient across the full height. */
        .green-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            #020a08 0%,
            #041a14 30%,
            #06251c 52%,
            #041a14 74%,
            #020a08 100%
          );
        }

        /* Soft radial vignette for a finished, premium depth cue. */
        .green-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 90% 75% at 50% 45%,
            transparent 0%,
            transparent 55%,
            rgba(0, 0, 0, 0.3) 100%
          );
        }

        // /* Faint full-area grid — quiet structure, not empty space. */
        // .green-grid {
        //   position: absolute;
        //   inset: 0;
        //   background-position: 400px 300px;
        //   background-image:
        //     repeating-linear-gradient(
        //       to right,
        //       rgba(94, 234, 212, 0.035) 0px,
        //       rgba(94, 234, 212, 0.035) 1px,
        //       transparent 1px,
        //       transparent px
        //     ),
        //     repeating-linear-gradient(
        //       to bottom,
        //       rgba(94, 234, 212, 0.03) 0px,
        //       rgba(94, 234, 212, 0.03) 1px,
        //       transparent 1px,
        //       transparent 80px
        //     );
        }


        /* Randomly-scattered starry dots, confined to the upper
           (iceberg) zone — pure CSS, no extra DOM nodes. Two layers
           at different tile sizes/opacities avoid a repeating-grid
           look. */
        .green-stars {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 46%;
          min-height: 420px;
          background-image:
            radial-gradient(1.3px 1.3px at 8% 12%, rgba(226, 255, 245, 0.85) 50%, transparent 51%),
            radial-gradient(1px 1px at 21% 34%, rgba(226, 255, 245, 0.6) 50%, transparent 51%),
            radial-gradient(1.6px 1.6px at 37% 9%, rgba(226, 255, 245, 0.75) 50%, transparent 51%),
            radial-gradient(1px 1px at 52% 27%, rgba(226, 255, 245, 0.5) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 66% 15%, rgba(226, 255, 245, 0.7) 50%, transparent 51%),
            radial-gradient(1px 1px at 79% 38%, rgba(226, 255, 245, 0.55) 50%, transparent 51%),
            radial-gradient(1.4px 1.4px at 91% 20%, rgba(226, 255, 245, 0.8) 50%, transparent 51%),
            radial-gradient(1px 1px at 4% 46%, rgba(226, 255, 245, 0.45) 50%, transparent 51%);
          background-repeat: repeat;
          background-size: 420px 420px;
        }

        .green-stars::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 14% 60%, rgba(226, 255, 245, 0.5) 50%, transparent 51%),
            radial-gradient(1.3px 1.3px at 29% 78%, rgba(226, 255, 245, 0.65) 50%, transparent 51%),
            radial-gradient(1px 1px at 45% 55%, rgba(226, 255, 245, 0.4) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 61% 82%, rgba(226, 255, 245, 0.6) 50%, transparent 51%),
            radial-gradient(1px 1px at 74% 60%, rgba(226, 255, 245, 0.45) 50%, transparent 51%),
            radial-gradient(1.4px 1.4px at 88% 88%, rgba(226, 255, 245, 0.7) 50%, transparent 51%),
            radial-gradient(1px 1px at 96% 65%, rgba(226, 255, 245, 0.4) 50%, transparent 51%);
          background-repeat: repeat;
          background-size: 500px 500px;
        }

        .green-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
        }

        .green-ai-illustration {
          position: absolute;
          top: 652px;
          left: -125px;
          width: min(620px, 48vw);
          opacity: 0.27;
          pointer-events: none;
          user-select: none;
          z-index: 1;
        }

        .green-waves {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 62%;
        }

        .green-wave-line {
          fill: none;
          stroke-width: 1.2;
        }

        /* Reusable frame for text/content blocks so they read clearly
           against the ambient background instead of blending in. */
        .green-panel {
          position: relative;
          border: 1px solid rgba(94, 234, 212, 0.14);
          border-radius: 12px;
          background: rgba(3, 18, 15, 0.4);
          backdrop-filter: blur(8px);
        }
      `}</style>

      <div className="green-base" />
      <div className="green-vignette" />
      <div className="green-grid" />
      <div className="green-stars" />
      <img
        src={robo1}
        alt=""
        loading="lazy"
        decoding="async"
        className="green-ai-illustration"
      />

      {GLOW_BLOBS.map((b, i) => (
        <div
          key={i}
          className="green-glow"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle, rgba(${b.color}, ${b.op}) 0%, rgba(${b.color}, ${b.op * 0.35}) 45%, transparent 72%)`,
          }}
        />
      ))}

      {/* Grain, for a premium, non-flat finish */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 1000" preserveAspectRatio="none">
        <defs>
          <filter id="grainFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
          </filter>
        </defs>
        <rect x="0" y="0" width="1440" height="1000" filter="url(#grainFilter)" opacity="0.05" />
      </svg>

      {/* Layered ridge waves — fills the lower portion of the page
          with soft shape instead of leaving it empty. */}
      <svg
        className="green-waves"
        viewBox="0 0 1440 620"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="waveFillA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.025" />
            <stop offset="100%" stopColor="#010805" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="waveFillB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#010805" stopOpacity="0.68" />
          </linearGradient>
          <linearGradient id="waveFillC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.035" />
            <stop offset="100%" stopColor="#010805" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id="waveEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="50%" stopColor="#5eead4" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0,140 C240,100 480,180 720,140 C960,100 1200,180 1440,140 L1440,620 L0,620 Z"
          fill="url(#waveFillA)"
        />
        <path
          d="M0,140 C240,100 480,180 720,140 C960,100 1200,180 1440,140"
          className="green-wave-line"
          stroke="url(#waveEdge)"
        />

        <path
          d="M0,300 C300,260 600,340 900,300 C1100,275 1300,320 1440,300 L1440,620 L0,620 Z"
          fill="url(#waveFillB)"
        />
        <path
          d="M0,300 C300,260 600,340 900,300 C1100,275 1300,320 1440,300"
          className="green-wave-line"
          stroke="url(#waveEdge)"
        />

        <path
          d="M0,460 C260,420 520,500 800,460 C1040,425 1250,490 1440,460 L1440,620 L0,620 Z"
          fill="url(#waveFillC)"
        />
        <path
          d="M0,460 C260,420 520,500 800,460 C1040,425 1250,490 1440,460"
          className="green-wave-line"
          stroke="url(#waveEdge)"
        />
      </svg>
    </div>
  );
}

export default Green;