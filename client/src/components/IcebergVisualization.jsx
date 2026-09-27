import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * IcebergVisualization
 * ---------------------------------------------------------------
 * Drag the iceberg in any direction — it stretches toward the cursor
 * like a rubber band (soft resistance, not 1:1 movement), and on
 * release it snaps back to its resting spot with a damped spring
 * overshoot (rebound). The water group is completely separate and
 * never moves — its baseline level is constant — but a reactive
 * "disturbance" ripple grows/shrinks under the iceberg based on how
 * far it's been dragged, plus small splash rings fire on grab and
 * on release, so the water visibly responds without its level
 * ever changing.
 * ---------------------------------------------------------------
 */

const VIEWBOX_W = 760;

/* =========================================================
   ICEBERG PHYSICS
   ========================================================= */

// Heavy, delayed follow instead of rubber-band movement
const FOLLOW_LERP = 0.11;
const MAX_STRETCH = 125;

// Smooth translational buoyancy rebound
const SPRING_K = 0.011;
const SPRING_DAMPING = 0.65;

// Smooth rotational buoyancy / angular rebound
const ROTATION_K = 0.018;
const ROTATION_DAMPING = 0.94;
const MAX_ROTATION = 11;

// Water reacts slower than the iceberg
const WATER_SPRING = 0.018;
const WATER_DAMPING = 0.90;

const SETTLE_EPS = 0.025;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function IcebergVisualization() {
  const svgRef = useRef(null);
  const dragGroupRef = useRef(null);

  const waterDisturbanceRef = useRef(null);
  const waterImpactRef = useRef(null);
  const mainWaveRef = useRef(null);
  const shimmerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [labelsHidden, setLabelsHidden] = useState(false);
  const labelTimerRef = useRef(null);
  const [splashes, setSplashes] = useState([]);
  const splashIdRef = useRef(0);
  const reducedMotionRef = useRef(false);

  // Physics state lives in refs so the animation loop never waits on React renders
  const pos = useRef({ x: 0, y: 0 });
  const prevPos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  // Rotational physics
  const rotation = useRef(0);
  const angularVelocity = useRef(0);
  const targetRotation = useRef(0);

  // Water physics
  const waterPos = useRef({ x: 0, y: 0 });
  const waterVelocity = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const runningRef = useRef(false);
  const rafId = useRef(null);
  const scaleRef = useRef(1);
  const pointerStart = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      reducedMotionRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
  }, []);

  const spawnSplash = useCallback((cx, big) => {
    if (reducedMotionRef.current) return;

    const id = splashIdRef.current++;

    setSplashes((s) => [...s, { id, cx, big }]);

    window.setTimeout(() => {
      setSplashes((s) => s.filter((sp) => sp.id !== id));
    }, big ? 900 : 650);
  }, []);

  const computeIntensity = (p) => {
    const downFactor = clamp(p.y / 130, -0.4, 1);
    const lateral = Math.min(Math.abs(p.x) / 200, 1);

    return clamp(downFactor * 0.8 + lateral * 0.6, 0, 1);
  };

  const applyVisuals = useCallback(() => {
    const p = pos.current;
    const v = vel.current;

    /* =========================================================
       ICEBERG TRANSFORM
       ========================================================= */

    if (dragGroupRef.current) {
      let transform = `translate(${p.x.toFixed(
        2
      )}px, ${p.y.toFixed(2)}px)`;

      if (!reducedMotionRef.current) {
        const speed = Math.hypot(v.x, v.y);
        const rot = rotation.current;

        const scale = 1 + clamp(speed * 0.008, 0, 0.035);

        transform += ` rotate(${rot.toFixed(
          2
        )}deg) scale(${scale.toFixed(3)})`;
      }

      dragGroupRef.current.style.transform = transform;
    }

    /* =========================================================
       WATER RESPONSE
       ========================================================= */

    const intensity = computeIntensity(p);

    const wx = waterPos.current;
    const wv = waterVelocity.current;

    /*
     * Water doesn't follow the iceberg instantly.
     * It has its own spring and damping.
     */
    const waterTargetX = p.x * 0.58;
    const waterTargetY = p.y * 0.20;

    const waterForceX =
      (waterTargetX - wx.x) * WATER_SPRING;

    const waterForceY =
      (waterTargetY - wx.y) * WATER_SPRING;

    wv.x =
      (wv.x + waterForceX) * WATER_DAMPING;

    wv.y =
      (wv.y + waterForceY) * WATER_DAMPING;

    wx.x += wv.x;
    wx.y += wv.y;

    /* =========================================================
       WATER DISTURBANCE
       ========================================================= */

    const waterCx = 380 + wx.x;

    if (waterDisturbanceRef.current) {
      const rx = 55 + intensity * 95;
      const ry = 7 + intensity * 11;

      const disturbanceY = clamp(
        200 +
          wx.y * 1.15 +
          wv.y * 5,
        184,
        218
      );

      waterDisturbanceRef.current.setAttribute(
        "cx",
        waterCx.toFixed(1)
      );

      waterDisturbanceRef.current.setAttribute(
        "cy",
        disturbanceY.toFixed(1)
      );

      waterDisturbanceRef.current.setAttribute(
        "rx",
        rx.toFixed(1)
      );

      waterDisturbanceRef.current.setAttribute(
        "ry",
        ry.toFixed(1)
      );

      waterDisturbanceRef.current.setAttribute(
        "opacity",
        (
          0.12 +
          intensity * 0.38
        ).toFixed(2)
      );
    }

    /* =========================================================
       LOCAL WATER SURFACE
       ========================================================= */

    if (waterImpactRef.current) {
      const cx = 380 + wx.x;

      const halfWidth =
        85 + intensity * 90;

      const left = cx - halfWidth;
      const right = cx + halfWidth;

      const verticalPush = clamp(
        wx.y * 0.85 +
          wv.y * 8,
        -15,
        20
      );

      const sideCrest = clamp(
        verticalPush * -0.32,
        -7,
        7
      );

      const c1x =
        left + halfWidth * 0.32;

      const c2x =
        cx - halfWidth * 0.25;

      const c3x =
        cx + halfWidth * 0.25;

      const c4x =
        right - halfWidth * 0.32;

      const d = `
        M ${left.toFixed(1)} 200

        C
          ${c1x.toFixed(1)} 200,
          ${c2x.toFixed(1)} ${(200 + sideCrest).toFixed(1)},
          ${cx.toFixed(1)} ${(200 + verticalPush).toFixed(1)}

        C
          ${c3x.toFixed(1)} ${(200 + sideCrest).toFixed(1)},
          ${c4x.toFixed(1)} 200,
          ${right.toFixed(1)} 200
      `;

      waterImpactRef.current.setAttribute(
        "d",
        d
      );

      waterImpactRef.current.setAttribute(
        "opacity",
        clamp(
          0.18 +
            intensity * 0.32 +
            Math.abs(wv.y) * 0.9,
          0.18,
          0.72
        ).toFixed(2)
      );
    }

    /* =========================================================
       EXISTING MAIN WAVE
       ========================================================= */

    if (mainWaveRef.current) {
      mainWaveRef.current.style.strokeWidth =
        (
          1.7 +
          intensity * 2.2 +
          Math.abs(wv.y) * 1.5
        ).toFixed(2);

      mainWaveRef.current.style.strokeOpacity =
        Math.min(
          0.48 +
            intensity * 0.4 +
            Math.abs(wv.y) * 0.5,
          0.9
        ).toFixed(2);
    }

    /* =========================================================
       EXISTING SHIMMER
       ========================================================= */

    if (shimmerRef.current) {
      shimmerRef.current.style.strokeOpacity =
        Math.min(
          0.75 +
            intensity * 0.25,
          1
        ).toFixed(2);
    }
  }, [computeIntensity]);

  const tick = useCallback(() => {
    const p = pos.current;
    const v = vel.current;

    /* =========================================================
       DRAGGING
       ========================================================= */

    if (draggingRef.current) {
      /*
       * Heavy elastic follow.
       *
       * Cursor moves first.
       * Iceberg follows slightly behind.
       */
      p.x +=
        (target.current.x - p.x) *
        FOLLOW_LERP;

      p.y +=
        (target.current.y - p.y) *
        FOLLOW_LERP;

      /* -------------------------------------------------------
         Linear velocity
         ------------------------------------------------------- */

      v.x =
        (p.x - prevPos.current.x) *
        0.92;

      v.y =
        (p.y - prevPos.current.y) *
        0.92;

      prevPos.current = {
        x: p.x,
        y: p.y,
      };

      /* -------------------------------------------------------
         ROTATIONAL PHYSICS
         ------------------------------------------------------- */

      const rotationError =
        targetRotation.current -
        rotation.current;

      angularVelocity.current +=
        rotationError * ROTATION_K;

      angularVelocity.current *=
        ROTATION_DAMPING;

      rotation.current +=
        angularVelocity.current;

      rotation.current = clamp(
        rotation.current,
        -MAX_ROTATION,
        MAX_ROTATION
      );

      applyVisuals();

      rafId.current =
        requestAnimationFrame(tick);

      return;
    }

    /* =========================================================
       TRANSLATIONAL BUOYANCY REBOUND
       ========================================================= */

    const fx =
      -SPRING_K * p.x;

    const fy =
      -SPRING_K * p.y;

    v.x =
      (v.x + fx) *
      SPRING_DAMPING;

    v.y =
      (v.y + fy) *
      SPRING_DAMPING;

    p.x += v.x;
    p.y += v.y;

    prevPos.current = {
      x: p.x,
      y: p.y,
    };

    /* =========================================================
       ROTATIONAL BUOYANCY REBOUND
       ========================================================= */

    const rotationError =
      targetRotation.current -
      rotation.current;

    angularVelocity.current +=
      rotationError * ROTATION_K;

    angularVelocity.current *=
      ROTATION_DAMPING;

    rotation.current +=
      angularVelocity.current;

    rotation.current = clamp(
      rotation.current,
      -MAX_ROTATION,
      MAX_ROTATION
    );

    /* =========================================================
       APPLY
       ========================================================= */

    applyVisuals();

    /* =========================================================
       SETTLE
       ========================================================= */

    const settled =
      Math.abs(p.x) < SETTLE_EPS &&
      Math.abs(p.y) < SETTLE_EPS &&
      Math.abs(v.x) < SETTLE_EPS &&
      Math.abs(v.y) < SETTLE_EPS &&
      Math.abs(rotation.current) < 0.035 &&
      Math.abs(angularVelocity.current) < 0.015 &&
      Math.abs(waterPos.current.x) < 0.04 &&
      Math.abs(waterPos.current.y) < 0.04 &&
      Math.abs(waterVelocity.current.x) < 0.02 &&
      Math.abs(waterVelocity.current.y) < 0.02;

    if (settled) {
      p.x = 0;
      p.y = 0;

      v.x = 0;
      v.y = 0;

      rotation.current = 0;
      angularVelocity.current = 0;
      targetRotation.current = 0;

      waterPos.current.x = 0;
      waterPos.current.y = 0;

      waterVelocity.current.x = 0;
      waterVelocity.current.y = 0;

      applyVisuals();

      runningRef.current = false;
      setInteracting(false);

      return;
    }

    rafId.current =
      requestAnimationFrame(tick);
  }, [applyVisuals]);

  const ensureLoopRunning = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      rafId.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const handlePointerDown = (e) => {
    e.preventDefault();

    const targetElement = e.currentTarget;

    try {
      targetElement.setPointerCapture(e.pointerId);
    } catch {}

    const rect = svgRef.current.getBoundingClientRect();

    scaleRef.current = VIEWBOX_W / rect.width;

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    dragStartPos.current = {
      x: pos.current.x,
      y: pos.current.y,
    };

    target.current = {
      x: pos.current.x,
      y: pos.current.y,
    };

    targetRotation.current =
      rotation.current;

    draggingRef.current = true;

    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    setIsDragging(true);
    setInteracting(true);
    setLabelsHidden(true);

    spawnSplash(
      380 + pos.current.x * 0.55,
      false
    );

    ensureLoopRunning();
  };

  const handlePointerMove = useCallback((e) => {
    if (!draggingRef.current) return;

    const dxScreen =
      e.clientX - pointerStart.current.x;

    const dyScreen =
      e.clientY - pointerStart.current.y;

    const dx =
      dxScreen * scaleRef.current;

    const dy =
      dyScreen * scaleRef.current;

    const rawX =
      dragStartPos.current.x + dx;

    const rawY =
      dragStartPos.current.y + dy;

    // Rubber-band resistance: stretch eases toward MAX_STRETCH the further you pull
    const dist = Math.hypot(rawX, rawY);

    if (dist > 0.001) {
      const eased =
        MAX_STRETCH *
        (1 - Math.exp(-dist / MAX_STRETCH));

      const k = eased / dist;

      target.current.x = rawX * k;
      target.current.y = rawY * k;
    } else {
      target.current.x = 0;
      target.current.y = 0;
    }

    /* =========================================================
       ROTATION TARGET
       ========================================================= */

    const desiredRotation =
      target.current.x * 0.045 +
      target.current.y * 0.018;

    targetRotation.current = clamp(
      desiredRotation,
      -MAX_ROTATION,
      MAX_ROTATION
    );
  }, []);

  const handlePointerUp = (e) => {
    draggingRef.current = false;
    setIsDragging(false);
    targetRotation.current = 0;

    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => {
      setLabelsHidden(false);
    }, 100);

    try {
      if (
        e.currentTarget.hasPointerCapture(
          e.pointerId
        )
      ) {
        e.currentTarget.releasePointerCapture(
          e.pointerId
        );
      }
    } catch {}

    spawnSplash(
      380 + pos.current.x * 0.55,
      true
    );

    ensureLoopRunning();
  };

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (labelTimerRef.current) {
        clearTimeout(labelTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="pointer-events-auto relative flex w-full items-center justify-center overflow-visible bg-transparent select-none"
      style={{ touchAction: "none" }}
    >
      <div className="relative z-10 flex flex-col items-center">
        <svg
          ref={svgRef}
          viewBox="0 0 760 920"
          style={{
            pointerEvents: "auto",
            touchAction: "none",
          }}
          className="h-[800px] w-auto max-w-full overflow-visible drop-shadow-[0_20px_55px_rgba(13,148,136,0.25)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
          {/* Premium Translucent Label Gradients & Glowing Border */}
          <linearGradient id="labelBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#071b2e" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#030e1a" stopOpacity="0.58" />
          </linearGradient>

          <linearGradient id="labelBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.55" />
          </linearGradient>

          <filter id="labelBadgeShadow" x="-40%" y="-50%" width="180%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#020912" floodOpacity="0.5" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#38bdf8" floodOpacity="0.2" />

          </filter>

            {/* =====================================================
                ATMOSPHERIC FILTERS
               ===================================================== */}

            <filter
              id="emeraldTealMist"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="8" />
            </filter>

            <filter
              id="subsurfaceSunScatter"
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="24" />
            </filter>

            {/* =====================================================
                ABOVE WATER — SNOW
               ===================================================== */}

            <linearGradient
              id="snowSunlitFace"
              x1="330"
              y1="35"
              x2="480"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#ffffff"
              />
              <stop
                offset="30%"
                stopColor="#f0fdfa"
              />
              <stop
                offset="70%"
                stopColor="#ccfbf1"
              />
              <stop
                offset="100%"
                stopColor="#5eead4"
                stopOpacity="0.85"
              />
            </linearGradient>

            <linearGradient
              id="snowShadowFace"
              x1="370"
              y1="35"
              x2="210"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#e2e8f0"
              />
              <stop
                offset="40%"
                stopColor="#64748b"
              />
              <stop
                offset="85%"
                stopColor="#1e293b"
              />
              <stop
                offset="100%"
                stopColor="#0f172a"
              />
            </linearGradient>

            {/* =====================================================
                UNDERWATER — DEPTH
               ===================================================== */}

            <linearGradient
              id="depthAttenuatedBody"
              x1="380"
              y1="200"
              x2="380"
              y2="890"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#2dd4bf"
                stopOpacity="0.95"
              />
              <stop
                offset="12%"
                stopColor="#14b8a6"
                stopOpacity="0.92"
              />
              <stop
                offset="28%"
                stopColor="#0d9488"
                stopOpacity="0.9"
              />
              <stop
                offset="50%"
                stopColor="#0f766e"
                stopOpacity="0.92"
              />
              <stop
                offset="72%"
                stopColor="#115e59"
                stopOpacity="0.95"
              />
              <stop
                offset="88%"
                stopColor="#042f2e"
                stopOpacity="0.98"
              />
              <stop
                offset="100%"
                stopColor="#021815"
              />
            </linearGradient>

            <linearGradient
              id="deepLeftShadowWall"
              x1="120"
              y1="200"
              x2="380"
              y2="880"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#0f766e"
                stopOpacity="0.9"
              />
              <stop
                offset="20%"
                stopColor="#115e59"
                stopOpacity="0.95"
              />
              <stop
                offset="50%"
                stopColor="#042f2e"
                stopOpacity="0.98"
              />
              <stop
                offset="80%"
                stopColor="#021815"
              />
              <stop
                offset="100%"
                stopColor="#010e0c"
              />
            </linearGradient>

            <linearGradient
              id="sunlitDepthFlank"
              x1="640"
              y1="210"
              x2="380"
              y2="880"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#99f6e4"
                stopOpacity="0.92"
              />
              <stop
                offset="18%"
                stopColor="#2dd4bf"
                stopOpacity="0.82"
              />
              <stop
                offset="42%"
                stopColor="#0d9488"
                stopOpacity="0.7"
              />
              <stop
                offset="68%"
                stopColor="#0f766e"
                stopOpacity="0.6"
              />
              <stop
                offset="90%"
                stopColor="#042f2e"
                stopOpacity="0.5"
              />
              <stop
                offset="100%"
                stopColor="#021815"
                stopOpacity="0.3"
              />
            </linearGradient>

            {/* =====================================================
                SUBSURFACE LIGHT
               ===================================================== */}

            <radialGradient
              id="sunWaterlineGlow"
              cx="50%"
              cy="25%"
              r="60%"
            >
              <stop
                offset="0%"
                stopColor="#5eead4"
                stopOpacity="0.75"
              />
              <stop
                offset="40%"
                stopColor="#14b8a6"
                stopOpacity="0.35"
              />
              <stop
                offset="80%"
                stopColor="#0f766e"
                stopOpacity="0.05"
              />
              <stop
                offset="100%"
                stopColor="#042f2e"
                stopOpacity="0"
              />
            </radialGradient>

            {/* =====================================================
                WATERLINE
               ===================================================== */}

            <linearGradient
              id="waterlineSheen"
              x1="50"
              y1="200"
              x2="710"
              y2="200"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0%"
                stopColor="#0d9488"
                stopOpacity="0"
              />
              <stop
                offset="15%"
                stopColor="#5eead4"
                stopOpacity="0.45"
              />
              <stop
                offset="50%"
                stopColor="#ffffff"
                stopOpacity="0.95"
              />
              <stop
                offset="85%"
                stopColor="#2dd4bf"
                stopOpacity="0.45"
              />
              <stop
                offset="100%"
                stopColor="#0d9488"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* ========================================================
              SUBSURFACE LIGHT
             ======================================================== */}

          <ellipse
            cx="390"
            cy="320"
            rx="210"
            ry="140"
            fill="url(#sunWaterlineGlow)"
            filter="url(#subsurfaceSunScatter)"
          />

          <path
            ref={waterImpactRef}
            d="
                M 180 200
                C 230 200, 290 200, 350 200
                C 410 200, 470 200, 530 200
                C 570 200, 610 200, 650 200
              "
            fill="none"
            stroke="#ccfbf1"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0"
            pointerEvents="none"
          />

          {/* ========================================================
              ICEBERG — DRAG + SPRING LAYER
             ======================================================== */}

          <g
            className={`iceberg-float${
              interacting ? " paused" : ""
            }`}
          >
            <g
              ref={dragGroupRef}
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 60%",
                willChange: "transform",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >

              
              {/* =====================================================
                  UNDERWATER ICE MASS
                 ===================================================== */}

              <g id="underwater-iceberg-mass">

  {/* Main submerged mass */}
  <path
    d="
      M 210 200
      C 255 202, 315 205, 375 208
      C 440 204, 505 201, 550 200

      L 598 232
      L 632 275
      L 650 320
      L 628 360
      L 668 410
      L 642 455
      L 615 492
      L 590 545
      L 550 590
      L 520 640
      L 478 690
      L 450 740
      L 425 790
      L 405 835
      L 390 875
      L 378 905

      L 365 892
      L 350 850
      L 330 805
      L 300 760
      L 270 710
      L 230 660
      L 195 610
      L 165 560
      L 135 510
      L 120 475
      L 142 420
      L 105 365
      L 132 310
      L 158 260
      Z
    "
    fill="url(#depthAttenuatedBody)"
  />

  {/* Deep left shadow wall */}
  <path
    d="
      M 210 200
      C 260 202, 320 205, 375 208

      L 350 275
      L 332 350
      L 315 425
      L 325 500
      L 305 575
      L 318 650
      L 300 715
      L 330 805
      L 350 850
      L 365 892

      L 350 850
      L 330 805
      L 300 760
      L 270 710
      L 230 660
      L 195 610
      L 165 560
      L 135 510
      L 120 475
      L 142 420
      L 105 365
      L 132 310
      L 158 260
      Z
    "
    fill="url(#deepLeftShadowWall)"
  />

  {/* Deepest left-side pocket */}
  <path
    d="
      M 158 260
      L 235 285
      L 250 345
      L 230 420
      L 195 500
      L 165 560
      L 135 510
      L 120 475
      L 142 420
      L 105 365
      L 132 310
      Z
    "
    fill="#01100e"
    fillOpacity="0.55"
  />

  {/* Central submerged face */}
  <path
    d="
      M 375 208
      L 470 245
      L 450 315
      L 430 390
      L 455 455
      L 470 520
      L 445 590
      L 430 665
      L 410 735
      L 395 805
      L 378 905

      L 365 892
      L 350 850
      L 330 805
      L 300 715
      L 318 650
      L 305 575
      L 325 500
      L 315 425
      L 332 350
      L 350 275
    "
    fill="url(#depthAttenuatedBody)"
  />

  {/* Sunlit right flank */}
  <path
    d="
      M 375 208
      L 470 245
      L 598 232
      L 632 275
      L 650 320
      L 628 360
      L 668 410
      L 642 455
      L 615 492
      L 590 545
      L 550 590
      L 520 640
      L 478 690
      L 450 740
      L 425 790
      L 405 835
      L 390 875
      L 378 905

      L 395 805
      L 410 735
      L 430 665
      L 445 590
      L 470 520
      L 455 455
      L 430 390
      L 450 315
    "
    fill="url(#sunlitDepthFlank)"
  />

  {/* Upper submerged shelf */}
  <path
    d="
      M 470 245
      L 598 232
      L 632 275
      L 650 320
      L 565 345
      L 500 315
      Z
    "
    fill="#99f6e4"
    fillOpacity="0.32"
  />

  {/* Middle illuminated plane */}
  <path
    d="
      M 455 455
      L 565 345
      L 628 360
      L 668 410
      L 570 455
      L 470 520
      Z
    "
    fill="#0d9488"
    fillOpacity="0.45"
  />

  {/* Mid-depth green plane */}
  <path
    d="
      M 445 590
      L 520 640
      L 478 690
      L 450 740
      L 425 790
      L 405 835
      L 390 875
      L 378 905
      L 410 735
      Z
    "
    fill="#063f3a"
    fillOpacity="0.48"
  />

  {/* Deep lower shadow */}
  <path
    d="
      M 330 805
      L 365 892
      L 378 905
      L 390 875
      L 405 835
      L 425 790
      L 450 740
      L 410 735
      Z
    "
    fill="#021815"
    fillOpacity="0.72"
  />

  {/* Left depth transition */}
  <path
    d="
      M 230 660
      L 270 710
      L 300 760
      L 330 805
      L 350 850
      L 365 892
      L 350 850
      L 330 805
      L 300 715
      L 318 650
      Z
    "
    fill="#022824"
    fillOpacity="0.30"
  />

  {/* Central depth transition */}
  <path
    d="
      M 318 650
      L 330 805
      L 350 850
      L 365 892
      L 378 905
      L 395 805
      L 410 735
      L 430 665
      L 445 590
      Z
    "
    fill="#021e1b"
    fillOpacity="0.34"
  />

  {/* Right deep attenuation */}
  <path
    d="
      M 445 590
      L 520 640
      L 478 690
      L 450 740
      L 425 790
      L 405 835
      L 390 875
      L 378 905
      L 410 735
      L 430 665
      Z
    "
    fill="#011512"
    fillOpacity="0.42"
  />

  {/* Soft depth facet */}
  <path
    d="
      M 325 500
      L 330 575
      L 305 650
      L 270 710
      L 230 660
      L 195 610
      L 165 560
      L 195 500
      L 230 420
      Z
    "
    fill="#06433e"
    fillOpacity="0.16"
  />

  {/* Right-side submerged facet */}
  <path
    d="
      M 470 520
      L 570 455
      L 615 492
      L 590 545
      L 550 590
      L 520 640
      L 445 590
      Z
    "
    fill="#062e2b"
    fillOpacity="0.20"
  />

  {/* Structural depth edges */}
  <polyline
    points="
      375,208
      350,275
      332,350
      315,425
    "
    stroke="#ccfbf1"
    strokeOpacity="0.40"
    strokeWidth="1.7"
    fill="none"
  />

  <polyline
    points="
      315,425
      325,500
      305,575
      318,650
      300,715
      330,805
      365,892
    "
    stroke="#0f766e"
    strokeOpacity="0.28"
    strokeWidth="1.3"
    fill="none"
  />

  <polyline
    points="
      375,208
      470,245
      450,315
      430,390
    "
    stroke="#99f6e4"
    strokeOpacity="0.46"
    strokeWidth="1.8"
    fill="none"
  />

  <polyline
    points="
      430,390
      455,455
      470,520
      445,590
      430,665
      410,735
      390,875
    "
    stroke="#14b8a6"
    strokeOpacity="0.22"
    strokeWidth="1.4"
    fill="none"
  />

  <polyline
    points="
      470,245
      500,315
      565,345
      628,360
    "
    stroke="#5eead4"
    strokeOpacity="0.30"
    strokeWidth="1.4"
    fill="none"
  />

  <polyline
    points="
      450,315
      500,315
      565,345
      570,455
      520,520
    "
    stroke="#2dd4bf"
    strokeOpacity="0.16"
    strokeWidth="1.2"
    fill="none"
  />

  <polyline
    points="
      305,575
      318,650
      270,710
    "
    stroke="#14b8a6"
    strokeOpacity="0.18"
    strokeWidth="1.2"
    fill="none"
  />

  {/* Tiny deep highlight — keeps the mass dimensional */}
  <path
    d="
      M 405 835
      C 412 810, 420 780, 425 755
    "
    stroke="#0d9488"
    strokeOpacity="0.16"
    strokeWidth="2"
    strokeLinecap="round"
    fill="none"
  />

</g>

              {/* =====================================================
                  ABOVE WATER PEAK
                 ===================================================== */}

                            <g id="above-water-pinnacle">

                {/* =========================================================
                    MAIN ICEBERG SILHOUETTE
                    ========================================================= */}

                <path
                  d="
                    M 210,200

                    L 224,181
                    L 218,160
                    L 242,143
                    L 238,125
                    L 270,111
                    L 286,91
                    L 316,68
                    L 348,46
                    L 365,34

                    L 377,67
                    L 398,82
                    L 395,105
                    L 425,117
                    L 441,137
                    L 472,147
                    L 495,166
                    L 525,182
                    L 550,200

                    Z
                  "
                  fill="url(#snowShadowFace)"
                />

              {/* =========================================================
                  LEFT OUTER SHADOW FACE
                  Smooth iceberg shoulder — no side cones.
                ========================================================= */}

              <path
                d="
                  M 210,200

                  L 225,184
                  L 232,166
                  L 244,149
                  L 258,134
                  L 274,119
                  L 290,101
                  L 308,84
                  L 327,68
                  L 348,46
                  L 365,34

                  L 354,73
                  L 337,101
                  L 322,128
                  L 305,151
                  L 292,166
                  L 278,181
                  L 270,193
                  L 265,200

                  Z
                "
                fill="url(#snowShadowFace)"
                fillOpacity="0.96"
              />

                {/* =========================================================
                    LEFT INNER ICE FACE
                    ========================================================= */}

                <path
                  d="
                    M 316,68
                    L 348,46
                    L 365,34

                    L 354,73
                    L 337,101
                    L 322,128
                    L 337,139
                    L 343,147
                    L 370,160
                    L 355,181
                    L 345,200
                    L 265,200
                    L 270,193
                    L 278,181
                    L 292,166
                    L 305,151
                    L 322,128
                    L 337,101
                    L 354,73

                    Z
                  "
                  fill="url(#snowSunlitFace)"
                  fillOpacity="0.40"
                />

                {/* =========================================================
                  LEFT BLUE ICE FACET
                ========================================================= */}

              <path
                d="
                  M 258,134
                  L 274,119
                  L 290,101
                  L 322,128
                  L 305,151
                  L 292,166
                  L 278,181
                  L 225,184
                  L 232,166
                  L 244,149

                  Z
                "
                fill="#cbd5e1"
                fillOpacity="0.48"
              />

                {/* =========================================================
                    LOWER LEFT TRANSITION
                    ========================================================= */}

                <path
                  d="
                    M 210,200
                    L 224,181
                    L 278,181
                    L 292,166
                    L 305,151
                    L 322,128
                    L 337,139
                    L 343,147
                    L 370,160
                    L 355,181
                    L 345,200

                    Z
                  "
                  fill="#94a3b8"
                  fillOpacity="0.36"
                />

                {/* =========================================================
                    CENTRAL ICE BODY
                    ========================================================= */}

                <path
                  d="
                    M 316,68
                    L 348,46
                    L 365,34

                    L 377,67
                    L 354,73
                    L 337,101
                    L 322,128
                    L 337,139
                    L 343,147
                    L 370,160
                    L 393,177
                    L 405,200

                    L 345,200
                    L 355,181
                    L 370,160
                    L 343,147
                    L 337,139
                    L 322,128
                    L 337,101
                    L 354,73

                    Z
                  "
                  fill="url(#snowSunlitFace)"
                  fillOpacity="0.50"
                />

                {/* =========================================================
                    CENTRAL BRIGHT RIDGE
                    ========================================================= */}

                <path
                  d="
                    M 365,34
                    L 377,67
                    L 354,73
                    L 337,101
                    L 322,128
                    L 337,139
                    L 343,147
                    L 370,160
                    L 393,177
                    L 399,151
                    L 383,127
                    L 389,103
                    L 377,67

                    Z
                  "
                  fill="#f8fffe"
                  fillOpacity="0.64"
                />

                {/* =========================================================
                    LOWER CENTRAL ICE PLANE
                    ========================================================= */}

                <path
                  d="
                    M 305,151
                    L 322,128
                    L 337,139
                    L 343,147
                    L 370,160
                    L 393,177
                    L 405,200
                    L 345,200
                    L 355,181
                    L 370,160
                    L 343,147

                    Z
                  "
                  fill="#e2f7f5"
                  fillOpacity="0.70"
                />

                {/* =========================================================
                    RIGHT SUNLIT FACE
                    ========================================================= */}

                <path
                  d="
                    M 377,67
                    L 398,82
                    L 395,105
                    L 425,117
                    L 441,137
                    L 472,147
                    L 495,166
                    L 525,182
                    L 550,200

                    L 405,200
                    L 393,177
                    L 399,151
                    L 383,127
                    L 389,103

                    Z
                  "
                  fill="url(#snowSunlitFace)"
                  fillOpacity="0.82"
                />

                {/* =========================================================
                    RIGHT INTERNAL ICE FACET
                    ========================================================= */}

                <path
                  d="
                    M 425,117
                    L 441,137
                    L 472,147
                    L 495,166
                    L 525,182
                    L 550,200

                    L 405,200
                    L 393,177
                    L 399,151
                    L 425,160
                    L 450,153
                    L 472,147

                    Z
                  "
                  fill="#dff8f5"
                  fillOpacity="0.38"
                />

                {/* =========================================================
                    TOP SNOW CAP
                    ========================================================= */}

                <path
                  d="
                    M 316,68
                    L 348,46
                    L 365,34
                    L 377,67
                    L 354,73
                    L 337,88

                    Z
                  "
                  fill="#ffffff"
                  fillOpacity="0.62"
                />

                {/* =========================================================
                    RIGHT TOP HIGHLIGHT
                    ========================================================= */}

                <path
                  d="
                    M 377,67
                    L 398,82
                    L 395,105
                    L 383,127
                    L 377,102
                    L 354,73

                    Z
                  "
                  fill="#ffffff"
                  fillOpacity="0.48"
                />

                {/* =========================================================
                    LEFT ICE FACET DETAIL
                    ========================================================= */}

                <path
                  d="
                    M 270,111
                    L 286,91
                    L 316,68
                    L 322,128
                    L 270,111

                    Z
                  "
                  fill="#eef6f7"
                  fillOpacity="0.20"
                />

                {/* =========================================================
                    NATURAL ICE RIDGE — MAIN
                    ========================================================= */}

                <polyline
                  points="
                    365,34
                    377,67
                    354,73
                    337,101
                    322,128
                    337,139
                    343,147
                    370,160
                    393,177
                    405,200
                  "
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeOpacity="0.78"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* =========================================================
                    RIGHT ICE RIDGE
                    ========================================================= */}

                <polyline
                  points="
                    377,67
                    389,103
                    383,127
                    399,151
                    393,177
                  "
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeOpacity="0.62"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* =========================================================
                    LEFT FACET RIDGE
                    ========================================================= */}

                <polyline
                  points="
                    270,111
                    322,128
                    305,151
                    343,147
                  "
                  stroke="#dbeafe"
                  strokeWidth="1.4"
                  strokeOpacity="0.50"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* =========================================================
                    RIGHT LIGHT BREAK
                    ========================================================= */}

                <polyline
                  points="
                    425,117
                    441,137
                    472,147
                    495,166
                    525,182
                    550,200
                  "
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  strokeOpacity="0.42"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* =========================================================
                    SUBTLE WATERLINE
                    ========================================================= */}

                <polyline
                  points="
                    210,200
                    265,200
                    345,200
                    405,200
                    470,200
                    550,200
                  "
                  stroke="#ffffff"
                  strokeWidth="1.7"
                  strokeOpacity="0.40"
                  strokeLinecap="round"
                />

              </g>

              </g>
          </g>


                    {/* ========================================================
              WATER
             ======================================================== */}

          <g id="waterline-and-mist">

            {/* Wide subsurface water — independent from iceberg */}

<g
  id="subsurface-water-density"
  pointerEvents="none"
>

  {/* Main gaseous band */}
  <path
    d="
      M 70 200
      C 160 197, 235 203, 315 200
      C 400 197, 480 203, 560 200
      C 635 198, 690 202, 720 200

      C 700 214, 665 224, 625 226
      C 570 220, 515 228, 455 224
      C 390 220, 330 228, 270 224
      C 205 220, 135 227, 70 218
      Z
    "
    fill="#8fd8ce"
    fillOpacity="0.12"
    filter="url(#subsurfaceSunScatter)"
  />

  {/* Second cloudy layer */}
  {/* <path
    d="
      M 75 208
      C 160 204, 240 212, 320 208
      C 405 204, 485 212, 565 208
      C 630 205, 690 211, 715 208
      C 690 233, 650 246, 605 248
      C 550 241, 495 250, 435 246
      C 370 241, 310 250, 245 245
      C 180 240, 120 248, 75 235
      Z
    "
    fill="#78bfb6"
    fillOpacity="0.085"
    filter="url(#subsurfaceSunScatter)"
  /> */}

  {/* Deep soft haze */}
  {/* <path
    d="
      M 90 220
      C 175 214, 255 224, 335 220
      C 415 215, 495 225, 570 220
      C 635 217, 690 224, 710 220

      C 675 252, 635 270, 590 272
      C 535 266, 475 278, 410 272
      C 345 267, 285 277, 220 270
      C 165 264, 115 270, 90 257
      Z
    "
    fill="#4faaa0"
    fillOpacity="0.065"
    filter="url(#subsurfaceSunScatter)"
  /> */}

  {/* Deepest faint layer */}
  <path
    d="
      M 115 238
      C 190 232, 265 241, 340 238
      C 415 234, 490 243, 565 238
      C 625 235, 680 242, 700 239

      C 665 270, 625 288, 575 290
      C 515 284, 455 296, 395 290
      C 330 285, 270 295, 210 288
      C 165 282, 130 288, 115 275
      Z
    "
    fill="#285f5a"
    fillOpacity="0.035"
    filter="url(#subsurfaceSunScatter)"
  />

  {/* Broken cloudy streaks */}
  <path
    d="
      M 95 209
      C 170 205, 235 212, 300 208
      C 355 205, 395 212, 445 208
      C 505 205, 550 212, 610 208
      C 655 205, 690 211, 710 208
    "
    fill="none"
    stroke="#b9eee7"
    strokeOpacity="0.10"
    strokeWidth="5"
    strokeLinecap="round"
    filter="url(#subsurfaceSunScatter)"
  />

  <path
    d="
      M 80 222
      C 145 217, 205 225, 270 221
      C 325 217, 375 225, 430 221
      C 490 217, 545 225, 605 221
      C 650 218, 685 223, 715 220
    "
    fill="none"
    stroke="#72bdb5"
    strokeOpacity="0.08"
    strokeWidth="7"
    strokeLinecap="round"
    filter="url(#subsurfaceSunScatter)"
  />

</g>
            <ellipse
              cx="380"
              cy="200"
              rx="315"
              ry="24"
              fill="#5eead4"
              fillOpacity="0.07"
              filter="url(#emeraldTealMist)"
            />

            <ellipse
              ref={waterDisturbanceRef}
              cx="380"
              cy="200"
              rx="0"
              ry="0"
              fill="#2dd4bf"
              opacity="0"
              filter="url(#emeraldTealMist)"
            />

            {splashes.map((s) => (
              <circle
                key={s.id}
                cx={s.cx}
                cy="200"
                r="4"
                fill="none"
                stroke="#99f6e4"
                strokeWidth="1.6"
                className={
                  s.big
                    ? "splash-ring splash-ring-big"
                    : "splash-ring"
                }
              />
            ))}

            <path
              d="
                M 20 196
                C 55 191, 90 200, 125 196
                C 160 192, 195 201, 230 196
                C 265 191, 300 200, 335 196
                C 370 192, 405 201, 440 196
                C 475 191, 510 200, 545 196
                C 580 192, 615 201, 650 196
                C 685 192, 720 199, 750 196
              "
              fill="none"
              stroke="#5eead4"
              strokeWidth="1.2"
              strokeOpacity="0.22"
              className="water-wave water-wave-back"
            />

            <path
              ref={mainWaveRef}
              d="
                M 15 200
                C 45 195, 75 204, 105 200
                C 135 196, 165 204, 195 200
                C 225 196, 255 204, 285 200
                C 315 196, 345 204, 375 200
                C 405 196, 435 204, 465 200
                C 495 196, 525 204, 555 200
                C 585 196, 615 204, 645 200
                C 675 196, 705 204, 745 200
              "
              fill="none"
              stroke="#99f6e4"
              strokeWidth="1.7"
              strokeOpacity="0.48"
              className="water-wave water-wave-main"
            />

            <path
              d="
                M 35 198
                C 80 195, 120 201, 165 198
                C 210 195, 250 201, 295 198
                C 340 195, 380 201, 425 198
                C 470 195, 510 201, 555 198
                C 600 195, 640 198, 685 198
                C 710 197, 730 200, 755 198
              "
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeOpacity="0.35"
              className="water-wave water-wave-light"
            />

            <path
              d="M 80 200 Q 105 195 130 200 T 180 200"
              fill="none"
              stroke="#ccfbf1"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.42"
              className="water-ripple ripple-one"
            />

            <path
              d="M 190 201 Q 215 205 240 201 T 290 201"
              fill="none"
              stroke="#ccfbf1"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.30"
              className="water-ripple ripple-two"
            />

            <path
              d="M 470 200 Q 495 195 520 200 T 570 200"
              fill="none"
              stroke="#ccfbf1"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.38"
              className="water-ripple ripple-three"
            />

            <path
              d="M 575 201 Q 600 205 625 201 T 675 201"
              fill="none"
              stroke="#ccfbf1"
              strokeWidth="1"
              strokeLinecap="round"
              strokeOpacity="0.28"
              className="water-ripple ripple-four"
            />

            <g
              stroke="#ffffff"
              strokeLinecap="round"
              strokeOpacity="0.3"
            >
              <line
                x1="105"
                y1="197"
                x2="145"
                y2="197"
                className="water-glint glint-one"
              />

              <line
                x1="255"
                y1="202"
                x2="290"
                y2="202"
                className="water-glint glint-two"
              />

              <line
                x1="490"
                y1="197"
                x2="530"
                y2="197"
                className="water-glint glint-three"
              />

              <line
                x1="625"
                y1="202"
                x2="660"
                y2="202"
                className="water-glint glint-four"
              />
            </g>

            <path
              ref={shimmerRef}
              d="
                M 55 200
                C 180 198, 275 201, 380 199
                C 485 201, 580 198, 705 200
              "
              fill="none"
              stroke="url(#waterlineSheen)"
              strokeWidth="1.4"
              strokeOpacity="0.75"
              className="waterline-shimmer"
            />

            <ellipse
              cx="380"
              cy="200"
              rx="280"
              ry="10"
              fill="#ccfbf1"
              fillOpacity="0.045"
              filter="url(#emeraldTealMist)"
              className="surface-mist"
            />
          </g>

          {/* Smooth subsurface texture */}

<path
  d="
    M 75 214
    C 155 208, 235 216, 315 212
    C 395 208, 475 216, 555 212
    C 635 208, 690 214, 715 212

    C 680 230, 640 238, 585 236
    C 520 233, 460 242, 395 238
    C 330 234, 270 242, 205 237
    C 145 233, 105 238, 75 230
  "
  fill="none"
  stroke="#8acdc5"
  strokeOpacity="0.055"
  strokeWidth="18"
  strokeLinecap="round"
  filter="url(#subsurfaceSunScatter)"
/>

<path
  d="
    M 95 228
    C 170 222, 245 230, 320 226
    C 400 222, 480 231, 555 226
    C 620 223, 675 229, 700 226

    C 665 246, 620 255, 565 252
    C 505 249, 445 258, 385 253
    C 320 249, 260 258, 200 252
    C 150 248, 115 254, 95 246
  "
  fill="none"
  stroke="#5eaaa3"
  strokeOpacity="0.04"
  strokeWidth="22"
  strokeLinecap="round"
  filter="url(#subsurfaceSunScatter)"
/>
        
          {/* ========================================================
              PIPELINE LABELS — MODERN & PREMIUM GLASSMORPHIC BADGES
             ======================================================== */}
          <g
            className={`iceberg-labels${labelsHidden ? " is-hidden" : ""}`}
            pointerEvents="none"
            aria-hidden="true"
          >
            {/* TOP */}
            <g className="iceberg-label iceberg-label-center">
              <rect x="286" y="7" width="188" height="28" rx="7" className="iceberg-label-box" />
              <text x="380" y="25" textAnchor="middle" className="iceberg-label-title">
                ONBOARDING GUIDE
              </text>
              <line x1="380" y1="35" x2="380" y2="48" className="iceberg-label-line" />
              <circle cx="380" cy="48" r="2" className="iceberg-label-dot" />
            </g>

            {/* RIGHT 1: GROUNDING / REPAIR */}
            <g className="iceberg-label iceberg-label-right">
              <rect x="576" y="78" width="176" height="28" rx="7" className="iceberg-label-box" />
              <text x="664" y="96" textAnchor="middle" className="iceberg-label-title">
                GROUNDING / REPAIR
              </text>
              <line x1="576" y1="92" x2="520" y2="92" className="iceberg-label-line" />
              <circle cx="520" cy="92" r="2" className="iceberg-label-dot" />
            </g>

            {/* LEFT 1: VALIDATION */}
            <g className="iceberg-label iceberg-label-left">
              <rect x="36" y="141" width="134" height="28" rx="7" className="iceberg-label-box" />
              <text x="103" y="159" textAnchor="middle" className="iceberg-label-title">
                VALIDATION
              </text>
              <line x1="170" y1="155" x2="240" y2="155" className="iceberg-label-line" />
              <circle cx="240" cy="155" r="2" className="iceberg-label-dot" />
            </g>

            {/* RIGHT 2: LLM GENERATION */}
            <g className="iceberg-label iceberg-label-right">
              <rect x="580" y="221" width="168" height="28" rx="7" className="iceberg-label-box" />
              <text x="664" y="239" textAnchor="middle" className="iceberg-label-title">
                LLM GENERATION
              </text>
              <line x1="580" y1="235" x2="510" y2="235" className="iceberg-label-line" />
              <circle cx="510" cy="235" r="2" className="iceberg-label-dot" />
            </g>

            {/* LEFT 2: CONTEXT CONSTRUCTION */}
            <g className="iceberg-label iceberg-label-left">
              <rect x="8" y="296" width="190" height="28" rx="7" className="iceberg-label-box" />
              <text x="103" y="314" textAnchor="middle" className="iceberg-label-title">
                CONTEXT CONSTRUCTION
              </text>
              <line x1="198" y1="310" x2="235" y2="310" className="iceberg-label-line" />
              <circle cx="235" cy="310" r="2" className="iceberg-label-dot" />
            </g>

            {/* RIGHT 3: MODULE ANALYSIS */}
            <g className="iceberg-label iceberg-label-right">
              <rect x="580" y="371" width="168" height="28" rx="7" className="iceberg-label-box" />
              <text x="664" y="389" textAnchor="middle" className="iceberg-label-title">
                MODULE ANALYSIS
              </text>
              <line x1="580" y1="385" x2="515" y2="385" className="iceberg-label-line" />
              <circle cx="515" cy="385" r="2" className="iceberg-label-dot" />
            </g>

            {/* LEFT 3: FILE PRIORITIZATION */}
            <g className="iceberg-label iceberg-label-left">
              <rect x="10" y="446" width="186" height="28" rx="7" className="iceberg-label-box" />
              <text x="103" y="464" textAnchor="middle" className="iceberg-label-title">
                FILE PRIORITIZATION
              </text>
              <line x1="196" y1="460" x2="235" y2="460" className="iceberg-label-line" />
              <circle cx="235" cy="460" r="2" className="iceberg-label-dot" />
            </g>

            {/* RIGHT 4: ENTRY POINTS */}
            <g className="iceberg-label iceberg-label-right">
              <rect x="590" y="521" width="154" height="28" rx="7" className="iceberg-label-box" />
              <text x="667" y="539" textAnchor="middle" className="iceberg-label-title">
                ENTRY POINTS
              </text>
              <line x1="590" y1="535" x2="510" y2="535" className="iceberg-label-line" />
              <circle cx="510" cy="535" r="2" className="iceberg-label-dot" />
            </g>

            {/* LEFT 4: DEPENDENCY ANALYSIS */}
            <g className="iceberg-label iceberg-label-left">
              <rect x="6" y="596" width="194" height="28" rx="7" className="iceberg-label-box" />
              <text x="103" y="614" textAnchor="middle" className="iceberg-label-title">
                DEPENDENCY ANALYSIS
              </text>
              <line x1="200" y1="610" x2="235" y2="610" className="iceberg-label-line" />
              <circle cx="235" cy="610" r="2" className="iceberg-label-dot" />
            </g>

            {/* RIGHT 5: PROJECT DETECTION */}
            <g className="iceberg-label iceberg-label-right">
              <rect x="580" y="671" width="174" height="28" rx="7" className="iceberg-label-box" />
              <text x="667" y="689" textAnchor="middle" className="iceberg-label-title">
                PROJECT DETECTION
              </text>
              <line x1="580" y1="685" x2="505" y2="685" className="iceberg-label-line" />
              <circle cx="505" cy="685" r="2" className="iceberg-label-dot" />
            </g>

            {/* LEFT 5: REPOSITORY SCAN */}
            <g className="iceberg-label iceberg-label-left">
              <rect x="20" y="746" width="166" height="28" rx="7" className="iceberg-label-box" />
              <text x="103" y="764" textAnchor="middle" className="iceberg-label-title">
                REPOSITORY SCAN
              </text>
              <line x1="186" y1="760" x2="235" y2="760" className="iceberg-label-line" />
              <circle cx="235" cy="760" r="2" className="iceberg-label-dot" />
            </g>

            {/* BOTTOM */}
            <g className="iceberg-label iceberg-label-center">
              <rect x="291" y="876" width="178" height="28" rx="7" className="iceberg-label-box" />
              <text x="380" y="894" textAnchor="middle" className="iceberg-label-title">
                REPOSITORY DATA
              </text>
              <line x1="380" y1="876" x2="380" y2="855" className="iceberg-label-line" />
              <circle cx="380" cy="855" r="2" className="iceberg-label-dot" />
            </g>
          </g>
        </svg>
      </div>

      <style>{`
  /* =========================================================
     ICEBERG FLOAT
     ========================================================= */

  .iceberg-float {
    animation: icebergFloat 9s ease-in-out infinite;
    will-change: transform;
  }

  @keyframes icebergFloat {
    0%,
    100% {
      transform: translate3d(0, 0, 0);
    }

    25% {
      transform: translate3d(0, -7px, 0);
    }

    50% {
      transform: translate3d(0, -16px, 0);
    }

    75% {
      transform: translate3d(0, -8px, 0);
    }
  }


  /* =========================================================
     PIPELINE LABELS
     Stationary
     ========================================================= */

  .iceberg-labels {
    opacity: 1;
    transition: opacity 140ms ease-out;
  }

  .iceberg-labels.is-hidden {
    opacity: 0;
    transition: opacity 70ms ease-out;
  }

  .iceberg-label-box {
    fill: url(#labelBadgeGrad);
    stroke: url(#labelBorderGrad);
    stroke-width: 1.1px;
    filter: url(#labelBadgeShadow);
  }

  /*
     Labels do not move.
     Only the iceberg has floating motion.
  */

  .iceberg-label {
    transform: none;
    animation: none;
    will-change: auto;
  }


  /* =========================================================
     LABEL TYPOGRAPHY
     ========================================================= */

  .iceberg-label-title {
    fill: #f0fdfa;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 1.2px;
  }

  .iceberg-label-dot {
    fill: #5eead4;
    opacity: 0.75;
  }

  .iceberg-label-line {
    stroke: rgba(94, 234, 212, 0.42);
    stroke-width: 1;
    stroke-linecap: round;
    stroke-dasharray: 2 3;
  }


  /* =========================================================
     WATER MOTION
     ========================================================= */

  @keyframes waterMain {
    0% {
      transform: translateX(0);
    }

    25% {
      transform: translateX(-6px);
    }

    50% {
      transform: translateX(-14px);
    }

    75% {
      transform: translateX(-5px);
    }

    100% {
      transform: translateX(0);
    }
  }

  @keyframes waterLight {
    0% {
      transform: translateX(8px);
      opacity: 0.18;
    }

    50% {
      transform: translateX(-14px);
      opacity: 0.48;
    }

    100% {
      transform: translateX(8px);
      opacity: 0.18;
    }
  }

  @keyframes rippleMove {
    0%,
    100% {
      transform: translateX(0) scaleX(1);
      opacity: 0.32;
    }

    50% {
      transform: translateX(-7px) scaleX(1.08);
      opacity: 0.62;
    }
  }

  @keyframes rippleMoveReverse {
    0%,
    100% {
      transform: translateX(0) scaleX(1);
      opacity: 0.24;
    }

    50% {
      transform: translateX(8px) scaleX(1.06);
      opacity: 0.52;
    }
  }

  @keyframes waterShimmer {
    0%,
    100% {
      opacity: 0.42;
      transform: translateX(0);
    }

    50% {
      opacity: 0.85;
      transform: translateX(-8px);
    }
  }

  @keyframes mistDrift {
    0%,
    100% {
      transform: translateX(-5px);
      opacity: 0.28;
    }

    50% {
      transform: translateX(8px);
      opacity: 0.52;
    }
  }

  @keyframes glintMove {
    0%,
    100% {
      opacity: 0.15;
    }

    50% {
      opacity: 0.55;
    }
  }


  /* =========================================================
     WATER ELEMENTS
     ========================================================= */

  .water-wave-back {
    animation: waterBack 11s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .water-wave-main {
    animation: waterMain 6.5s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .water-wave-light {
    animation: waterLight 4.8s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .water-ripple {
    animation: rippleMove 5s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
    will-change: transform, opacity;
  }

  .ripple-two {
    animation-name: rippleMoveReverse;
    animation-delay: -1.4s;
  }

  .ripple-three {
    animation-delay: -2.2s;
  }

  .ripple-four {
    animation-name: rippleMoveReverse;
    animation-delay: -3s;
  }

  .waterline-shimmer {
    animation: waterShimmer 5s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .surface-mist {
    animation: mistDrift 8s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }

  .water-glint {
    animation: glintMove 3.5s ease-in-out infinite;
  }

  .glint-two {
    animation-delay: -1s;
  }

  .glint-three {
    animation-delay: -2s;
  }

  .glint-four {
    animation-delay: -2.7s;
  }


  /* =========================================================
     SPLASH
     ========================================================= */

  @keyframes splashRing {
    0% {
      r: 4;
      stroke-opacity: 0.55;
      stroke-width: 2;
    }

    100% {
      r: 34;
      stroke-opacity: 0;
      stroke-width: 0.5;
    }
  }

  @keyframes splashRingBig {
    0% {
      r: 4;
      stroke-opacity: 0.65;
      stroke-width: 2.4;
    }

    100% {
      r: 62;
      stroke-opacity: 0;
      stroke-width: 0.4;
    }
  }

  .splash-ring {
    animation: splashRing 0.65s ease-out forwards;
    transform-box: fill-box;
  }

  .splash-ring-big {
    animation: splashRingBig 0.9s ease-out forwards;
  }


  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  @media (prefers-reduced-motion: reduce) {
    .iceberg-float,
    .water-wave-back,
    .water-wave-main,
    .water-wave-light,
    .water-ripple,
    .waterline-shimmer,
    .surface-mist,
    .water-glint,
    .splash-ring,
    .splash-ring-big {
      animation: none;
      will-change: auto;
    }

    .iceberg-labels,
    .iceberg-labels.is-hidden {
      transition: none;
    }

    .iceberg-label {
      animation: none;
      transform: none;
      will-change: auto;
    }
  }
`}</style>
    </div>
  );
}

export default IcebergVisualization;