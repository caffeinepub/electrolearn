import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";

interface Charge {
  x: number;
  y: number;
  q: number; // +1 or -1
}

const CHARGE_RADIUS = 18;
const NUM_FIELD_LINES = 16;
const FIELD_LINE_STEPS = 300;
const STEP_SIZE = 5;

function computeField(charges: Charge[], px: number, py: number) {
  let ex = 0;
  let ey = 0;
  for (const c of charges) {
    const dx = px - c.x;
    const dy = py - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < 100) continue;
    const r = Math.sqrt(r2);
    const mag = c.q / r2;
    ex += mag * (dx / r);
    ey += mag * (dy / r);
  }
  return { ex, ey };
}

function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  charges: Charge[],
  w: number,
  h: number,
) {
  for (const charge of charges) {
    if (charge.q <= 0) continue; // Only trace from positive charges

    for (let i = 0; i < NUM_FIELD_LINES; i++) {
      const angle = (i / NUM_FIELD_LINES) * Math.PI * 2;
      let px = charge.x + Math.cos(angle) * (CHARGE_RADIUS + 3);
      let py = charge.y + Math.sin(angle) * (CHARGE_RADIUS + 3);

      ctx.beginPath();
      ctx.moveTo(px, py);

      for (let step = 0; step < FIELD_LINE_STEPS; step++) {
        const { ex, ey } = computeField(charges, px, py);
        const mag = Math.sqrt(ex * ex + ey * ey);
        if (mag < 1e-6) break;

        px += (ex / mag) * STEP_SIZE;
        py += (ey / mag) * STEP_SIZE;

        if (px < 0 || px > w || py < 0 || py > h) break;

        // Check if reached a negative charge
        let hitSink = false;
        for (const c2 of charges) {
          if (
            c2.q < 0 &&
            Math.hypot(px - c2.x, py - c2.y) < CHARGE_RADIUS + 4
          ) {
            hitSink = true;
            break;
          }
        }

        ctx.lineTo(px, py);
        if (hitSink) break;

        // Draw arrowhead every N steps
        if (step % 60 === 30 && step > 10) {
          const { ex: ex2, ey: ey2 } = computeField(charges, px, py);
          const m2 = Math.sqrt(ex2 * ex2 + ey2 * ey2);
          if (m2 > 1e-6) {
            const ux = ex2 / m2;
            const uy = ey2 / m2;
            const aLen = 8;
            const aPx = px - ux * aLen;
            const aPy = py - uy * aLen;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(aPx - uy * aLen * 0.4, aPy + ux * aLen * 0.4);
            ctx.lineTo(aPx + uy * aLen * 0.4, aPy - ux * aLen * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(px, py);
          }
        }
      }
      ctx.stroke();
    }
  }
}

export default function ElectricFieldVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chargesRef = useRef<Charge[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [placingPositive, setPlacingPositive] = useState(true);
  const rafRef = useRef<number>(0);
  const draggingRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = "rgba(100, 140, 200, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const currentCharges = chargesRef.current;

    if (currentCharges.length === 0) {
      ctx.fillStyle = "rgba(100, 140, 200, 0.3)";
      ctx.font = "16px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Click on the canvas to place charges", w / 2, h / 2 - 10);
      ctx.font = "13px Sora, sans-serif";
      ctx.fillStyle = "rgba(100, 140, 200, 0.2)";
      ctx.fillText(
        "Use the toggle buttons to switch between + and − charges",
        w / 2,
        h / 2 + 18,
      );
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Draw field lines
    ctx.strokeStyle = "rgba(100, 190, 255, 0.5)";
    ctx.fillStyle = "rgba(100, 190, 255, 0.5)";
    ctx.lineWidth = 1.2;
    drawFieldLines(ctx, currentCharges, w, h);

    // Draw charges
    for (const charge of currentCharges) {
      const isPositive = charge.q > 0;
      const glowColor = isPositive
        ? "rgba(255, 100, 100, 0.5)"
        : "rgba(80, 130, 255, 0.5)";

      ctx.shadowBlur = 25;
      ctx.shadowColor = glowColor;

      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS + 5, 0, Math.PI * 2);
      ctx.strokeStyle = isPositive
        ? "rgba(255, 120, 120, 0.3)"
        : "rgba(100, 150, 255, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const grd = ctx.createRadialGradient(
        charge.x - 4,
        charge.y - 4,
        2,
        charge.x,
        charge.y,
        CHARGE_RADIUS,
      );
      if (isPositive) {
        grd.addColorStop(0, "rgba(255, 120, 120, 1)");
        grd.addColorStop(1, "rgba(180, 50, 50, 0.9)");
      } else {
        grd.addColorStop(0, "rgba(120, 160, 255, 1)");
        grd.addColorStop(1, "rgba(50, 80, 200, 0.9)");
      }

      ctx.beginPath();
      ctx.arc(charge.x, charge.y, CHARGE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "white";
      ctx.font = "bold 16px Bricolage Grotesque, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isPositive ? "+" : "−", charge.x, charge.y + 1);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    chargesRef.current = charges;
  }, [charges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [draw]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    const idx = chargesRef.current.findIndex(
      (c) => Math.hypot(x - c.x, y - c.y) < CHARGE_RADIUS + 6,
    );
    if (idx !== -1) {
      draggingRef.current = idx;
      dragOffsetRef.current = {
        dx: x - chargesRef.current[idx].x,
        dy: y - chargesRef.current[idx].y,
      };
    } else {
      // Place new charge
      setCharges((prev) => {
        if (prev.length >= 10) return prev;
        return [...prev, { x, y, q: placingPositive ? 1 : -1 }];
      });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (draggingRef.current === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCanvasPos(e);
    const i = draggingRef.current;
    setCharges((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        x: Math.max(
          CHARGE_RADIUS,
          Math.min(canvas.width - CHARGE_RADIUS, x - dragOffsetRef.current.dx),
        ),
        y: Math.max(
          CHARGE_RADIUS,
          Math.min(canvas.height - CHARGE_RADIUS, y - dragOffsetRef.current.dy),
        ),
      };
      return next;
    });
  };

  const onMouseUp = () => {
    draggingRef.current = null;
  };

  const clearCharges = () => setCharges([]);

  return (
    <section id="fields" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 70% 50%, oklch(0.12 0.05 240 / 0.5) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader
          badge="⚡ Simulation 2"
          title="Electric Field"
          titleAccent="Visualizer"
          description="Click to place positive or negative charges on the canvas. Watch how the electric field lines form around them in real-time."
          accentColor="cyan"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.82 0.17 198 / 0.4)",
                boxShadow: "0 0 20px oklch(0.82 0.17 198 / 0.15)",
              }}
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Field Line Visualizer
                </span>
                <span className="text-xs text-muted-foreground/60">
                  {charges.length} / 10 charges placed
                </span>
              </div>
              <canvas
                ref={canvasRef}
                data-ocid="fields.canvas_target"
                className="w-full select-none"
                style={{
                  height: "380px",
                  cursor:
                    draggingRef.current !== null ? "grabbing" : "crosshair",
                  background: "oklch(0.07 0.015 265)",
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            {/* Charge type selector */}
            <div
              className="rounded-xl p-4"
              style={{
                border: "1px solid oklch(0.82 0.17 198 / 0.4)",
                background: "oklch(0.08 0.01 265 / 0.8)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Charge Type
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-ocid="fields.add_positive.toggle"
                  onClick={() => setPlacingPositive(true)}
                  className={`py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                    placingPositive
                      ? "bg-red-500/30 border-2 border-red-400 text-red-300 shadow-[0_0_20px_rgba(255,80,80,0.4)]"
                      : "bg-muted/20 border border-border text-muted-foreground hover:border-red-400/50"
                  }`}
                >
                  +
                  <div className="text-xs font-normal mt-1 block">Positive</div>
                </button>
                <button
                  type="button"
                  data-ocid="fields.add_negative.toggle"
                  onClick={() => setPlacingPositive(false)}
                  className={`py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                    !placingPositive
                      ? "bg-blue-500/30 border-2 border-blue-400 text-blue-300 shadow-[0_0_20px_rgba(80,130,255,0.4)]"
                      : "bg-muted/20 border border-border text-muted-foreground hover:border-blue-400/50"
                  }`}
                >
                  −
                  <div className="text-xs font-normal mt-1 block">Negative</div>
                </button>
              </div>
            </div>

            {/* Charge list */}
            <div
              className="rounded-xl p-4 flex-1"
              style={{
                border: "1px solid oklch(0.82 0.17 198 / 0.3)",
                background: "oklch(0.08 0.01 265 / 0.8)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Placed Charges
              </div>
              {charges.length === 0 ? (
                <p className="text-muted-foreground/50 text-sm text-center py-4">
                  No charges placed yet
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                  {charges.map((c, i) => (
                    <div
                      key={`charge-${i}-${c.x.toFixed(0)}-${c.y.toFixed(0)}`}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/20"
                    >
                      <span
                        className="font-bold w-5 h-5 rounded-full flex items-center justify-center text-sm"
                        style={{
                          background:
                            c.q > 0
                              ? "rgba(255,80,80,0.3)"
                              : "rgba(80,130,255,0.3)",
                          color: c.q > 0 ? "#ff8080" : "#80a0ff",
                        }}
                      >
                        {c.q > 0 ? "+" : "−"}
                      </span>
                      <span className="text-muted-foreground">
                        ({Math.round(c.x)}, {Math.round(c.y)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear button */}
            <Button
              data-ocid="fields.clear.button"
              onClick={clearCharges}
              variant="outline"
              className="border-border hover:border-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
            >
              Clear All Charges
            </Button>

            {/* Instructions */}
            <div className="rounded-xl p-4 bg-muted/10 border border-border text-xs text-muted-foreground space-y-2">
              <p>• Click canvas to place charges</p>
              <p>• Drag existing charges to move them</p>
              <p>• Field lines flow from + to −</p>
              <p>• Max 10 charges at once</p>
            </div>
          </div>
        </div>

        {/* Educational text */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Electric Fields",
              text: "An electric field is a region of space where a charged particle experiences a force. Field lines show the direction a positive test charge would move.",
            },
            {
              title: "Field Line Rules",
              text: "Field lines originate from positive charges and terminate at negative charges. They never cross each other, and their density indicates field strength.",
            },
            {
              title: "Superposition Principle",
              text: "When multiple charges are present, the total electric field at any point is the vector sum of the fields from each individual charge — this is superposition.",
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
