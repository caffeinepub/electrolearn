import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";

type PhaseType =
  | "idle"
  | "charging"
  | "leader"
  | "strike"
  | "flash"
  | "dissipate";

interface NegCharge {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface LeaderSegment {
  x: number;
  y: number;
}

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function generateZigzag(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  roughness: number,
  depth: number,
): { x: number; y: number }[] {
  if (depth === 0)
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  const mx =
    (x1 + x2) / 2 + (Math.random() - 0.5) * roughness * Math.abs(x2 - x1 + 20);
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * roughness * 30;
  return [
    ...generateZigzag(x1, y1, mx, my, roughness * 0.85, depth - 1),
    ...generateZigzag(mx, my, x2, y2, roughness * 0.85, depth - 1).slice(1),
  ];
}

export default function LightningFormationDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<PhaseType>("idle");
  const frameRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const negChargesRef = useRef<NegCharge[]>([]);
  const leaderRef = useRef<LeaderSegment[]>([]);
  const returnStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strikeProgressRef = useRef<number>(0);
  const flashIntensityRef = useRef<number>(0);
  const [phase, setPhase] = useState<PhaseType>("idle");
  const [isRunning, setIsRunning] = useState(false);

  const sizeRef = useRef({ w: 0, h: 0 });

  const initNegCharges = useCallback(() => {
    const { w } = sizeRef.current;
    const charges: NegCharge[] = [];
    for (let i = 0; i < 30; i++) {
      charges.push({
        x: randomBetween(w * 0.1, w * 0.9),
        y: randomBetween(30, 120),
        vx: randomBetween(-0.4, 0.4),
        vy: randomBetween(0.1, 0.5),
      });
    }
    negChargesRef.current = charges;
  }, []);

  const drawIdle = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      skyGrad.addColorStop(0, "rgba(10, 12, 30, 1)");
      skyGrad.addColorStop(1, "rgba(20, 25, 60, 1)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.75);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
      groundGrad.addColorStop(0, "rgba(30, 40, 25, 1)");
      groundGrad.addColorStop(1, "rgba(15, 20, 12, 1)");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);

      // Cloud
      const cloudGrad = ctx.createRadialGradient(w / 2, 80, 10, w / 2, 80, 160);
      cloudGrad.addColorStop(0, "rgba(60, 70, 100, 0.95)");
      cloudGrad.addColorStop(0.5, "rgba(30, 35, 60, 0.9)");
      cloudGrad.addColorStop(1, "rgba(10, 12, 30, 0)");
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(w / 2, 80, 220, 80, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(100, 120, 180, 0.5)";
      ctx.font = "14px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Press Play to start the lightning formation demo",
        w / 2,
        h * 0.5,
      );
    },
    [],
  );

  const startAnimation = useCallback(() => {
    phaseRef.current = "charging";
    setPhase("charging");
    tickRef.current = 0;
    leaderRef.current = [];
    returnStrokeRef.current = [];
    strikeProgressRef.current = 0;
    flashIntensityRef.current = 0;
    initNegCharges();
    setIsRunning(true);
  }, [initNegCharges]);

  const resetAnimation = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    phaseRef.current = "idle";
    setPhase("idle");
    tickRef.current = 0;
    leaderRef.current = [];
    returnStrokeRef.current = [];
    strikeProgressRef.current = 0;
    flashIntensityRef.current = 0;
    negChargesRef.current = [];
    setIsRunning(false);
    // Trigger redraw
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawIdle(ctx, canvas.width, canvas.height);
    }
  }, [drawIdle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const groundY = h * 0.75;

    ctx.clearRect(0, 0, w, h);

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, "rgba(8, 10, 25, 1)");
    skyGrad.addColorStop(1, "rgba(18, 22, 55, 1)");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, groundY);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, "rgba(25, 35, 20, 1)");
    groundGrad.addColorStop(1, "rgba(12, 18, 10, 1)");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    const tick = tickRef.current;
    const currentPhase = phaseRef.current;

    // Flash effect
    if (flashIntensityRef.current > 0) {
      ctx.fillStyle = `rgba(200, 220, 255, ${flashIntensityRef.current * 0.35})`;
      ctx.fillRect(0, 0, w, h);
      flashIntensityRef.current *= 0.85;
    }

    // Cloud
    const chargeProgress = Math.min(1, tick / 180);
    const cloudDark = Math.floor(30 + chargeProgress * 40);
    const cloudGrad = ctx.createRadialGradient(w / 2, 80, 10, w / 2, 80, 180);
    cloudGrad.addColorStop(
      0,
      `rgba(${cloudDark * 1.5}, ${cloudDark * 1.2}, ${cloudDark + 60}, 0.97)`,
    );
    cloudGrad.addColorStop(
      0.5,
      `rgba(${cloudDark}, ${cloudDark}, ${cloudDark + 30}, 0.92)`,
    );
    cloudGrad.addColorStop(1, "rgba(8, 10, 25, 0)");
    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.ellipse(w / 2, 80, 220, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Positive charges on ground
    if (currentPhase !== "idle") {
      const numPosGround = Math.floor(chargeProgress * 15);
      for (let i = 0; i < numPosGround; i++) {
        const gx = w * 0.15 + i * ((w * 0.7) / 15);
        const gy = groundY + 10 + Math.sin(i + tick * 0.05) * 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(255, 180, 80, 0.8)";
        ctx.fillStyle = "rgba(255, 180, 80, 0.85)";
        ctx.beginPath();
        ctx.arc(gx, gy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 220, 120, 0.9)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", gx, gy + 1);
      }

      // Labels
      ctx.font = "12px Sora, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 180, 80, 0.7)";
      ctx.fillText("⊕ Positive charges", w * 0.88, groundY + 25);
      ctx.fillStyle = "rgba(100, 150, 255, 0.7)";
      ctx.textAlign = "left";
      ctx.fillText("⊖ Negative charges", w * 0.06, 55);
    }

    // Negative charges in cloud base
    for (const charge of negChargesRef.current) {
      if (currentPhase === "charging") {
        charge.x += charge.vx;
        charge.y += charge.vy;
        if (charge.x < w * 0.1 || charge.x > w * 0.9) charge.vx *= -1;
        if (charge.y > 155) {
          charge.y = 155;
          charge.vy *= -0.5;
        }
        if (charge.y < 20) {
          charge.y = 20;
          charge.vy *= -0.5;
        }
      }

      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(100, 150, 255, 0.8)";
      ctx.fillStyle = "rgba(100, 150, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Stepped leader
    if (
      (currentPhase === "leader" ||
        currentPhase === "strike" ||
        currentPhase === "flash" ||
        currentPhase === "dissipate") &&
      leaderRef.current.length > 0
    ) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(150, 200, 255, 0.7)";
      ctx.strokeStyle = "rgba(150, 200, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      leaderRef.current.forEach((pt, i) =>
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y),
      );
      ctx.stroke();

      // Core
      ctx.strokeStyle = "rgba(230, 240, 255, 0.6)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Return stroke / main lightning
    if (
      (currentPhase === "strike" ||
        currentPhase === "flash" ||
        currentPhase === "dissipate") &&
      returnStrokeRef.current.length > 0
    ) {
      const progress = strikeProgressRef.current;
      const visiblePts = returnStrokeRef.current.slice(
        0,
        Math.floor(progress * returnStrokeRef.current.length),
      );

      // Outer glow
      ctx.shadowBlur = 40;
      ctx.shadowColor = "rgba(180, 220, 255, 1)";
      ctx.strokeStyle = "rgba(180, 220, 255, 0.9)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      visiblePts.forEach((pt, i) =>
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y),
      );
      ctx.stroke();

      // Middle
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(220, 235, 255, 0.95)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Core white
      ctx.shadowBlur = 5;
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (strikeProgressRef.current < 1) {
        strikeProgressRef.current = Math.min(
          1,
          strikeProgressRef.current + 0.09,
        );
      }
    }

    // Phase transitions
    if (currentPhase === "charging" && tick > 220) {
      phaseRef.current = "leader";
      setPhase("leader");
      // Build stepped leader path
      const startX = w / 2 + randomBetween(-40, 40);
      leaderRef.current = generateZigzag(
        startX,
        155,
        startX + randomBetween(-60, 60),
        groundY - 10,
        0.8,
        7,
      );
      returnStrokeRef.current = generateZigzag(
        startX,
        155,
        startX + randomBetween(-30, 30),
        groundY - 5,
        0.7,
        8,
      );
    }

    if (currentPhase === "leader" && tick > 320) {
      phaseRef.current = "strike";
      setPhase("strike");
      strikeProgressRef.current = 0;
      flashIntensityRef.current = 1;
    }

    if (
      currentPhase === "strike" &&
      strikeProgressRef.current >= 1 &&
      tick > 380
    ) {
      phaseRef.current = "flash";
      setPhase("flash");
      flashIntensityRef.current = 1;
    }

    if (currentPhase === "flash" && tick > 440) {
      phaseRef.current = "dissipate";
      setPhase("dissipate");
    }

    if (currentPhase === "dissipate" && tick > 500) {
      phaseRef.current = "idle";
      setPhase("idle");
      setIsRunning(false);
    }

    tickRef.current++;
    frameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      sizeRef.current = { w: canvas.width, h: canvas.height };
      const ctx = canvas.getContext("2d");
      if (ctx) drawIdle(ctx, canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [drawIdle]);

  useEffect(() => {
    if (isRunning) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning, draw]);

  const phaseLabels: Record<PhaseType, string> = {
    idle: "Press Play to start",
    charging: "Charge buildup — Negative charges accumulate in cloud base...",
    leader: "Stepped leader descending — ionized channel forming...",
    strike: "Return stroke! Massive current flowing upward!",
    flash: "Lightning channel illuminated — 30,000 Kelvin!",
    dissipate: "Energy dissipating — thunder wave propagating...",
  };

  return (
    <section id="lightning" className="py-24 section-divider relative">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.15 0.07 250 / 0.8) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader
          badge="⚡ Simulation 3"
          title="Lightning"
          titleAccent="Formation"
          description="Watch the full sequence of a lightning strike — from charge buildup to the blinding return stroke. A billion volts in milliseconds."
          accentColor="gold"
        />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: "1px solid oklch(0.78 0.18 85 / 0.4)",
                boxShadow: "0 0 20px oklch(0.78 0.18 85 / 0.15)",
              }}
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Lightning Formation Demo
                </span>
                <span
                  className="text-xs"
                  style={{
                    color:
                      phase === "strike" || phase === "flash"
                        ? "oklch(0.82 0.18 85)"
                        : undefined,
                  }}
                >
                  {phaseLabels[phase]}
                </span>
              </div>
              <canvas
                ref={canvasRef}
                data-ocid="lightning.canvas_target"
                className="w-full select-none"
                style={{ height: "400px", background: "#080A19" }}
              />
            </div>
          </div>

          {/* Controls + info */}
          <div className="flex flex-col gap-4">
            {/* Controls */}
            <div
              className="rounded-xl p-5"
              style={{
                border: "1px solid oklch(0.78 0.18 85 / 0.4)",
                background: "oklch(0.08 0.01 265 / 0.9)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Animation Controls
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  data-ocid="lightning.play.button"
                  onClick={startAnimation}
                  disabled={isRunning}
                  className="font-semibold"
                  style={{
                    background: isRunning ? undefined : "oklch(0.78 0.18 85)",
                    color: isRunning ? undefined : "oklch(0.08 0.01 265)",
                    boxShadow: isRunning
                      ? undefined
                      : "0 0 20px oklch(0.78 0.18 85 / 0.4)",
                  }}
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  {isRunning ? "Running..." : "Play"}
                </Button>
                <Button
                  data-ocid="lightning.reset.button"
                  onClick={resetAnimation}
                  variant="outline"
                  className="border-border hover:border-muted-foreground/50"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Phase indicator */}
            <div
              className="rounded-xl p-4"
              style={{
                border: "1px solid oklch(0.78 0.18 85 / 0.3)",
                background: "oklch(0.08 0.01 265 / 0.8)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Formation Phases
              </div>
              <div className="space-y-2">
                {(
                  [
                    "charging",
                    "leader",
                    "strike",
                    "flash",
                    "dissipate",
                  ] as PhaseType[]
                ).map((p, i) => (
                  <div key={p} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        background:
                          phase === p
                            ? "oklch(0.82 0.18 85)"
                            : ["flash", "dissipate"].includes(phase) &&
                                i <=
                                  [
                                    "charging",
                                    "leader",
                                    "strike",
                                    "flash",
                                    "dissipate",
                                  ].indexOf(phase)
                              ? "oklch(0.72 0.2 235 / 0.5)"
                              : "oklch(0.3 0.02 265)",
                      }}
                    />
                    <span
                      className="text-xs capitalize"
                      style={{
                        color:
                          phase === p
                            ? "oklch(0.82 0.18 85)"
                            : "oklch(0.55 0.03 240)",
                        fontWeight: phase === p ? "600" : "normal",
                      }}
                    >
                      {i + 1}.{" "}
                      {p === "leader"
                        ? "Stepped Leader"
                        : p === "strike"
                          ? "Return Stroke"
                          : p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Facts */}
            <div className="rounded-xl p-4 bg-muted/10 border border-border text-xs text-muted-foreground space-y-2">
              <p>⚡ Peak temperature: ~30,000 K</p>
              <p>⚡ Peak current: 10,000–300,000 A</p>
              <p>⚡ Duration: ~0.2 seconds total</p>
              <p>⚡ Voltage: ~300 million volts</p>
            </div>
          </div>
        </div>

        {/* Educational cards */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Charge Separation",
              text: "Inside storm clouds, ice crystals and graupel collide, transferring electrons. Lighter ice rises, heavier graupel falls — creating a charge gradient.",
            },
            {
              title: "The Stepped Leader",
              text: "A faint channel of ionized air called the 'stepped leader' reaches invisibly toward the ground in 50-meter segments, seeking the path of least resistance.",
            },
            {
              title: "Return Stroke",
              text: "When the leader connects with an upward streamer from the ground, a massive current flows upward at 1/3 the speed of light — this is the visible flash we see.",
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
