import { useRef, useEffect, useCallback } from "react";

interface Lip {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
}

interface Drop {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Glitter {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface BgFlake {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
}

const LIP_SIZE = 44;
const DROP_R = 7;
const LIP_R = 18;
const GLITTER_COLORS = ["#ff4ac4", "#ff8ad9", "#E8C96A", "#7a1fd6", "#ffffff"];
const CLAMP_DEG = 85;

export function GlockMiniGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreElRef = useRef<HTMLDivElement>(null);
  const gunElRef = useRef<HTMLDivElement>(null);
  const splashElRef = useRef<SVGGElement>(null);

  // All mutable game state in refs — no React state = no re-renders.
  const lipsRef = useRef<Lip[]>([]);
  const dropsRef = useRef<Drop[]>([]);
  const glittersRef = useRef<Glitter[]>([]);
  const bgFlakesRef = useRef<BgFlake[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastShotRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);
  const renderedScoreRef = useRef(-1);
  const gunAngleRef = useRef(0);
  const renderedAngleRef = useRef(0);
  const splashUntilRef = useRef(0);
  const splashVisibleRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const runningRef = useRef(true);

  // Measure size once and on resize (ResizeObserver) — never per-frame.
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap for mobile
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    measure();

    // Init bg flakes once we know the size
    const flakes: BgFlake[] = [];
    for (let i = 0; i < 28; i++) {
      flakes.push({
        x: Math.random() * sizeRef.current.w,
        y: Math.random() * sizeRef.current.h,
        vy: 0.4 + Math.random() * 1.1,
        size: 1.5 + Math.random() * 2,
        color: GLITTER_COLORS[i % GLITTER_COLORS.length],
      });
    }
    bgFlakesRef.current = flakes;

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onVis = () => {
      runningRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Main sim + draw loop — all imperative, zero React state updates.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!runningRef.current) return;

      const { w: cssW, h: cssH, dpr } = sizeRef.current;
      if (cssW === 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Spawn lips (rate limited)
      if (t - lastSpawnRef.current > 850 && lipsRef.current.length < 9) {
        lastSpawnRef.current = t;
        lipsRef.current.push({
          id: ++idRef.current,
          x: 20 + Math.random() * (cssW - 40),
          y: -LIP_SIZE,
          vx: (Math.random() - 0.5) * 1.4,
          vy: 1.6 + Math.random() * 1.4,
          rot: (Math.random() - 0.5) * 30,
          vrot: (Math.random() - 0.5) * 1.5,
        });
      }

      // BG flakes (draw pass 1 — no shadows for perf)
      const bg = bgFlakesRef.current;
      ctx.globalAlpha = 0.45;
      for (let i = 0; i < bg.length; i++) {
        const f = bg[i];
        f.y += f.vy;
        if (f.y > cssH + 5) {
          f.y = -5;
          f.x = Math.random() * cssW;
        }
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Move lips
      const lips = lipsRef.current;
      const survivingLips: Lip[] = [];
      for (let i = 0; i < lips.length; i++) {
        const l = lips[i];
        l.x += l.vx;
        l.y += l.vy;
        l.rot += l.vrot;
        if (l.y > cssH + LIP_SIZE) continue;
        survivingLips.push(l);
      }
      lipsRef.current = survivingLips;

      // Move drops + collide
      const drops = dropsRef.current;
      const survivingDrops: Drop[] = [];
      const currentLips = lipsRef.current;
      let hits = 0;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < -20 || d.x > cssW + 20 || d.y < -20 || d.y > cssH + 20) continue;
        let hit = false;
        for (let j = 0; j < currentLips.length; j++) {
          const l = currentLips[j];
          if (l.vy < 0) continue; // marker for removed (unused, safety)
          const ddx = d.x - l.x;
          const ddy = d.y - l.y;
          if (ddx * ddx + ddy * ddy < (LIP_R + DROP_R) * (LIP_R + DROP_R)) {
            hit = true;
            hits++;
            // Burst glitter
            for (let k = 0; k < 12; k++) {
              const a = (Math.PI * 2 * k) / 12;
              glittersRef.current.push({
                id: ++idRef.current,
                x: l.x,
                y: l.y,
                vx: Math.cos(a) * (1.8 + Math.random() * 2.2),
                vy: Math.sin(a) * (1.8 + Math.random() * 2.2) - 1,
                life: 40,
                color: GLITTER_COLORS[k % GLITTER_COLORS.length],
              });
            }
            // Remove lip in-place
            currentLips.splice(j, 1);
            break;
          }
        }
        if (!hit) survivingDrops.push(d);
      }
      dropsRef.current = survivingDrops;

      if (hits > 0) {
        scoreRef.current += hits;
      }

      // Sync score to DOM only when it changed
      if (scoreRef.current !== renderedScoreRef.current && scoreElRef.current) {
        renderedScoreRef.current = scoreRef.current;
        scoreElRef.current.textContent = `💋 ${scoreRef.current}`;
      }

      // Sync gun rotation to DOM only when it changed
      if (gunAngleRef.current !== renderedAngleRef.current && gunElRef.current) {
        renderedAngleRef.current = gunAngleRef.current;
        gunElRef.current.style.transform = `rotate(${gunAngleRef.current}deg)`;
      }

      // Sync splash visibility
      const shouldShowSplash = t < splashUntilRef.current;
      if (shouldShowSplash !== splashVisibleRef.current && splashElRef.current) {
        splashVisibleRef.current = shouldShowSplash;
        splashElRef.current.style.opacity = shouldShowSplash ? "1" : "0";
      }

      // Move + draw glitters
      const glits = glittersRef.current;
      const survivingGlits: Glitter[] = [];
      for (let i = 0; i < glits.length; i++) {
        const g = glits[i];
        g.x += g.vx;
        g.y += g.vy;
        g.vy += 0.18;
        g.life -= 1;
        if (g.life <= 0) continue;
        survivingGlits.push(g);
        ctx.globalAlpha = g.life / 40;
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      glittersRef.current = survivingGlits;
      ctx.globalAlpha = 1;

      // Draw lips (single shadow pass)
      ctx.font = `${LIP_SIZE - 6}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#ff4ac4";
      ctx.shadowBlur = 10;
      for (let i = 0; i < currentLips.length; i++) {
        const l = currentLips[i];
        if (l.rot === 0) {
          ctx.fillText("💋", l.x, l.y);
        } else {
          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate((l.rot * Math.PI) / 180);
          ctx.fillText("💋", 0, 0);
          ctx.restore();
        }
      }
      ctx.shadowBlur = 0;

      // Draw drops (flat fill, one shadow pass)
      ctx.shadowColor = "#00d4ff";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#4ee0ff";
      const sd = dropsRef.current;
      for (let i = 0; i < sd.length; i++) {
        const d = sd[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, DROP_R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const pivot = useCallback(() => {
    const { w, h } = sizeRef.current;
    return { cx: w / 2, cy: h - 46 };
  }, []);

  const aim = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const p = pivot();
    const dx = clientX - rect.left - p.cx;
    const dy = clientY - rect.top - p.cy;
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg > CLAMP_DEG) deg = CLAMP_DEG;
    if (deg < -CLAMP_DEG) deg = -CLAMP_DEG;
    gunAngleRef.current = deg;
    return { p, deg };
  }, [pivot]);

  const shoot = useCallback(
    (clientX: number, clientY: number) => {
      const a = aim(clientX, clientY);
      if (!a) return;
      const now = performance.now();
      if (now - lastShotRef.current < 110) return;
      lastShotRef.current = now;
      splashUntilRef.current = now + 90;

      const rad = (a.deg * Math.PI) / 180;
      const ux = Math.sin(rad);
      const uy = -Math.cos(rad);
      const SPEED = 15;
      const MUZZLE = 34;
      dropsRef.current.push({
        id: ++idRef.current,
        x: a.p.cx + ux * MUZZLE,
        y: a.p.cy + uy * MUZZLE,
        vx: ux * SPEED,
        vy: uy * SPEED,
      });
    },
    [aim]
  );

  const pointerDownRef = useRef(false);
  const handleDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    shoot(e.clientX, e.clientY);
  };
  const handleMove = (e: React.PointerEvent) => {
    if (pointerDownRef.current) shoot(e.clientX, e.clientY);
    else aim(e.clientX, e.clientY);
  };
  const handleUp = (e: React.PointerEvent) => {
    pointerDownRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden touch-none select-none"
      style={{
        height: "min(68dvh, 480px)",
        background:
          "radial-gradient(ellipse at 50% 20%, #2a0d4a 0%, #0d0520 70%, #06010f 100%)",
        border: "2px solid #ff4ac466",
        contain: "layout paint size",
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: "block" }}
      />

      <div
        ref={scoreElRef}
        className="absolute top-3 right-3 px-3 py-1 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,74,196,0.35)",
          fontFamily: "var(--font-display)",
          fontSize: "1.15rem",
          color: "#fff",
          border: "1px solid #ff4ac4",
          letterSpacing: "0.05em",
          willChange: "contents",
        }}
      >
        💋 0
      </div>

      <div
        ref={gunElRef}
        className="absolute left-1/2 pointer-events-none"
        style={{
          bottom: 8,
          width: 76,
          height: 96,
          marginLeft: -38,
          transformOrigin: "50% 68px",
          transform: "rotate(0deg)",
          willChange: "transform",
          filter: "drop-shadow(0 4px 10px rgba(255,74,196,0.55))",
        }}
      >
        <svg viewBox="0 0 76 96" className="w-full h-full">
          <defs>
            <linearGradient id="gunPink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8ad9" />
              <stop offset="50%" stopColor="#ff4ac4" />
              <stop offset="100%" stopColor="#d63c91" />
            </linearGradient>
            <linearGradient id="tankBlue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a8f0ff" />
              <stop offset="100%" stopColor="#00a8e0" />
            </linearGradient>
          </defs>
          <rect x="30" y="4" width="16" height="34" rx="3" fill="url(#gunPink)" />
          <rect x="32" y="2" width="12" height="6" rx="2" fill="#d63c91" />
          <rect x="18" y="34" width="40" height="26" rx="6" fill="url(#gunPink)" />
          <ellipse cx="38" cy="47" rx="14" ry="10" fill="url(#tankBlue)" opacity="0.9" />
          <ellipse cx="34" cy="44" rx="4" ry="2.5" fill="#ffffff" opacity="0.7" />
          <path
            d="M 26 58 Q 26 72 38 72 Q 50 72 50 58 Z"
            fill="none"
            stroke="#d63c91"
            strokeWidth="3"
          />
          <rect x="35" y="60" width="6" height="10" rx="2" fill="#d63c91" />
          <path d="M 22 60 L 30 60 L 34 92 L 20 92 Z" fill="url(#gunPink)" />
          <line x1="24" y1="72" x2="32" y2="72" stroke="#d63c91" strokeWidth="1.5" />
          <line x1="24" y1="78" x2="32" y2="78" stroke="#d63c91" strokeWidth="1.5" />
          <line x1="24" y1="84" x2="33" y2="84" stroke="#d63c91" strokeWidth="1.5" />
          <g
            ref={splashElRef}
            style={{ opacity: 0, transition: "opacity 60ms linear" }}
          >
            <circle cx="38" cy="2" r="8" fill="#00d4ff" opacity="0.85" />
            <circle cx="30" cy="0" r="3" fill="#a8f0ff" opacity="0.9" />
            <circle cx="46" cy="0" r="3" fill="#a8f0ff" opacity="0.9" />
          </g>
        </svg>
      </div>

      <div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          bottom: 108,
          fontFamily: "var(--font-display)",
          fontSize: "0.72rem",
          color: "#ff8ad9aa",
          letterSpacing: "0.14em",
        }}
      >
        TOCÁ Y ARRASTRÁ PARA APUNTAR
      </div>
    </div>
  );
}
