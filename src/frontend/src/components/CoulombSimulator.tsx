import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";

const K = 8.99e9; // Coulomb's constant
const CHARGE_RADIUS = 28;
const CANVAS_SCALE = 0.01; // 1 pixel = 0.01 meter for simulation

interface Charge {
  x: number;
  y: number;
  q: number; // in microcoulombs
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number,
) {
  const headLen = 14;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function getCanvasPos(
  e: React.MouseEvent,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export default function CoulombSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charge1, setCharge1] = useState(2); // μC
  const [charge2, setCharge2] = useState(-2); // μC
  const [forceMag, setForceMag] = useState(0);
  const chargesRef = useRef<[Charge, Charge]>([
    { x: 0, y: 0, q: 2 },
    { x: 0, y: 0, q: -2 },
  ]);
  const draggingRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const rafRef = useRef<number>(0);

  const initPositions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    chargesRef.current[0].x = w * 0.35;
    chargesRef.current[0].y = h * 0.5;
    chargesRef.current[1].x = w * 0.65;
    chargesRef.current[1].y = h * 0.5;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const [c1, c2] = chargesRef.current;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = "rgba(100, 140, 200, 0.08)";
    ctx.lineWidth = 1;
    const gridStep = 50;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Compute force
    const dx = (c2.x - c1.x) * CANVAS_SCALE;
    const dy = (c2.y - c1.y) * CANVAS_SCALE;
    const r = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
    const q1SI = c1.q * 1e-6;
    const q2SI = c2.q * 1e-6;
    const force = (K * Math.abs(q1SI * q2SI)) / (r * r);
    setForceMag(force);

    // Direction of force
    const hypot = Math.hypot(c2.x - c1.x, c2.y - c1.y) || 1;
    const nx = (c2.x - c1.x) / hypot;
    const ny = (c2.y - c1.y) / hypot;
    const sameSign = Math.sign(c1.q) === Math.sign(c2.q);
    const arrowLen = Math.min(80, 20 + force * 0.00002);

    // Force arrows
    if (sameSign) {
      drawArrow(
        ctx,
        c1.x,
        c1.y,
        c1.x - nx * arrowLen,
        c1.y - ny * arrowLen,
        "rgba(255, 180, 80, 0.9)",
        2.5,
      );
      drawArrow(
        ctx,
        c2.x,
        c2.y,
        c2.x + nx * arrowLen,
        c2.y + ny * arrowLen,
        "rgba(255, 180, 80, 0.9)",
        2.5,
      );
    } else {
      drawArrow(
        ctx,
        c1.x,
        c1.y,
        c1.x + nx * arrowLen,
        c1.y + ny * arrowLen,
        "rgba(100, 200, 255, 0.9)",
        2.5,
      );
      drawArrow(
        ctx,
        c2.x,
        c2.y,
        c2.x - nx * arrowLen,
        c2.y - ny * arrowLen,
        "rgba(100, 200, 255, 0.9)",
        2.5,
      );
    }

    // Distance line
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(150, 180, 220, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance label
    const midX = (c1.x + c2.x) / 2;
    const midY = (c1.y + c2.y) / 2;
    ctx.fillStyle = "rgba(200, 220, 255, 0.7)";
    ctx.font = "12px Sora, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`r = ${r.toFixed(2)} m`, midX, midY - 14);

    // Draw charges
    const renderCharge = (charge: Charge) => {
      const isPositive = charge.q >= 0;
      const baseColor = isPositive ? [255, 80, 80] : [80, 130, 255];
      const glowColor = isPositive
        ? "rgba(255, 100, 100, 0.4)"
        : "rgba(80, 130, 255, 0.4)";

      ctx.shadowBlur = 30;
      ctx.shadowColor = glowColor;

      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS + 6, 0, Math.PI * 2);
      ctx.strokeStyle = isPositive
        ? "rgba(255, 120, 120, 0.4)"
        : "rgba(100, 150, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const gradient = ctx.createRadialGradient(
        charge.x - 6,
        charge.y - 6,
        2,
        charge.x,
        charge.y,
        CHARGE_RADIUS,
      );
      gradient.addColorStop(
        0,
        `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 1)`,
      );
      gradient.addColorStop(
        0.6,
        `rgba(${Math.floor(baseColor[0] * 0.7)}, ${Math.floor(baseColor[1] * 0.7)}, ${Math.floor(baseColor[2] * 0.7)}, 0.95)`,
      );
      gradient.addColorStop(
        1,
        `rgba(${Math.floor(baseColor[0] * 0.4)}, ${Math.floor(baseColor[1] * 0.4)}, ${Math.floor(baseColor[2] * 0.4)}, 0.8)`,
      );

      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 20px Bricolage Grotesque, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isPositive ? "+" : "−", charge.x, charge.y + 1);

      ctx.font = "12px Sora, sans-serif";
      ctx.textBaseline = "top";
      ctx.fillStyle = isPositive
        ? "rgba(255, 160, 160, 0.9)"
        : "rgba(130, 170, 255, 0.9)";
      ctx.fillText(
        `${Math.abs(charge.q).toFixed(1)} μC`,
        charge.x,
        charge.y + CHARGE_RADIUS + 10,
      );
    };

    renderCharge(c1);
    renderCharge(c2);

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initPositions();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [draw, initPositions]);

  // Sync charges from state to ref
  useEffect(() => {
    chargesRef.current[0].q = charge1;
    chargesRef.current[1].q = charge2;
  }, [charge1, charge2]);

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e, canvas);
    for (let i = 0; i < 2; i++) {
      const c = chargesRef.current[i];
      if (Math.hypot(x - c.x, y - c.y) < CHARGE_RADIUS + 8) {
        draggingRef.current = i;
        dragOffsetRef.current = { dx: x - c.x, dy: y - c.y };
        break;
      }
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (draggingRef.current === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e, canvas);
    const i = draggingRef.current;
    chargesRef.current[i].x = Math.max(
      CHARGE_RADIUS + 5,
      Math.min(canvas.width - CHARGE_RADIUS - 5, x - dragOffsetRef.current.dx),
    );
    chargesRef.current[i].y = Math.max(
      CHARGE_RADIUS + 5,
      Math.min(canvas.height - CHARGE_RADIUS - 5, y - dragOffsetRef.current.dy),
    );
  };

  const onMouseUp = () => {
    draggingRef.current = null;
  };

  const formatForce = (f: number) => {
    if (f >= 1) return `${f.toFixed(2)} N`;
    if (f >= 0.001) return `${(f * 1000).toFixed(2)} mN`;
    return `${(f * 1e6).toFixed(2)} μN`;
  };

  const r2 = Math.hypot(
    (chargesRef.current[1].x - chargesRef.current[0].x) * CANVAS_SCALE,
    (chargesRef.current[1].y - chargesRef.current[0].y) * CANVAS_SCALE,
  );

  return (
    <section id="coulomb" className="py-24 section-divider relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeader
          badge="⚡ Simulation 1"
          title="Coulomb's"
          titleAccent="Law"
          description="Drag the charged particles to explore how distance and charge magnitude affect the electrostatic force between them."
          accentColor="blue"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="electric-border rounded-2xl overflow-hidden bg-deep-space/80">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Interactive Simulator
                </span>
                <span className="text-xs text-muted-foreground/60">
                  Drag charges to reposition
                </span>
              </div>
              <canvas
                ref={canvasRef}
                data-ocid="coulomb.canvas_target"
                className="w-full cursor-grab active:cursor-grabbing select-none"
                style={{ height: "380px" }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Force display */}
            <div className="electric-border rounded-xl p-5 bg-deep-space/80 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Electrostatic Force
              </div>
              <div
                className="text-3xl font-display font-black text-glow-blue mb-1"
                style={{ color: "oklch(0.72 0.2 235)" }}
              >
                {formatForce(forceMag)}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.sign(charge1) === Math.sign(charge2)
                  ? "⟵ Repulsive ⟶"
                  : "⟶ Attractive ⟵"}
              </div>
            </div>

            {/* Formula */}
            <div className="rounded-xl p-4 bg-muted/30 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Formula
              </div>
              <div
                className="font-mono text-sm text-center py-2"
                style={{ color: "oklch(0.82 0.17 198)" }}
              >
                F = k|q₁q₂| / r²
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>k (Coulomb's constant)</span>
                  <span className="text-foreground/70">8.99×10⁹ N·m²/C²</span>
                </div>
                <div className="flex justify-between">
                  <span>q₁</span>
                  <span style={{ color: "oklch(0.7 0.2 20)" }}>
                    {charge1.toFixed(1)} μC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>q₂</span>
                  <span style={{ color: "oklch(0.65 0.2 250)" }}>
                    {charge2.toFixed(1)} μC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>r (distance)</span>
                  <span className="text-foreground/70">{r2.toFixed(2)} m</span>
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="rounded-xl p-4 bg-muted/20 border border-border space-y-5">
              <div>
                <div className="flex justify-between mb-3">
                  <label
                    htmlFor="charge1-slider"
                    className="text-sm font-medium text-foreground"
                  >
                    Charge 1 (q₁)
                  </label>
                  <span
                    className="text-sm font-mono"
                    style={{ color: "oklch(0.7 0.2 20)" }}
                  >
                    {charge1 > 0 ? "+" : ""}
                    {charge1.toFixed(1)} μC
                  </span>
                </div>
                <input
                  id="charge1-slider"
                  data-ocid="coulomb.charge1.input"
                  type="range"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={charge1}
                  onChange={(e) =>
                    setCharge1(Number.parseFloat(e.target.value))
                  }
                  className="w-full accent-red-400 h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                  <span>−10 μC</span>
                  <span>+10 μC</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-3">
                  <label
                    htmlFor="charge2-slider"
                    className="text-sm font-medium text-foreground"
                  >
                    Charge 2 (q₂)
                  </label>
                  <span
                    className="text-sm font-mono"
                    style={{ color: "oklch(0.65 0.2 250)" }}
                  >
                    {charge2 > 0 ? "+" : ""}
                    {charge2.toFixed(1)} μC
                  </span>
                </div>
                <input
                  id="charge2-slider"
                  data-ocid="coulomb.charge2.input"
                  type="range"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={charge2}
                  onChange={(e) =>
                    setCharge2(Number.parseFloat(e.target.value))
                  }
                  className="w-full accent-blue-400 h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                  <span>−10 μC</span>
                  <span>+10 μC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Educational text */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Coulomb's Law",
              text: "States that the electrostatic force between two point charges is proportional to the product of their magnitudes and inversely proportional to the square of the distance between them.",
            },
            {
              title: "Like Charges Repel",
              text: "Two charges of the same sign (both positive or both negative) experience a repulsive force that pushes them apart. The force arrows point outward.",
            },
            {
              title: "Opposite Charges Attract",
              text: "Charges of opposite signs experience an attractive force that pulls them together. The closer they get, the stronger the attraction grows exponentially.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl p-5 bg-muted/20 border border-border"
            >
              <h3 className="font-display font-bold text-base mb-2 text-foreground">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
