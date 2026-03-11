import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ChargeIndicator {
  x: number;
  y: number;
  age: number;
}

export default function StaticElectricityDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const chargeIndicatorsRef = useRef<ChargeIndicator[]>([]);
  const rafRef = useRef<number>(0);
  const chargeRef = useRef<number>(0);
  const [charge, setCharge] = useState(0);
  const isRubbingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const rubSpeedRef = useRef(0);

  const SPARK_COLORS = useRef([
    "rgba(180, 220, 255",
    "rgba(255, 220, 100",
    "rgba(140, 200, 255",
    "rgba(255, 255, 255",
  ]);

  const spawnSparks = useCallback((x: number, y: number, speed: number) => {
    const count = Math.floor(speed * 3 + 2);
    const colors = SPARK_COLORS.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = 0.5 + Math.random() * speed * 2;
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel - 1,
        life: 0,
        maxLife: 20 + Math.floor(Math.random() * 30),
        size: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    chargeIndicatorsRef.current.push({ x, y, age: 0 });
  }, []);

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

    // Draw objects (balloon and sweater/rod)
    const balloonX = w * 0.35;
    const balloonY = h * 0.45;
    const ropeY = h * 0.7;
    const rodX = w * 0.65;

    // Balloon rope
    ctx.strokeStyle = "rgba(150, 120, 80, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(balloonX, balloonY + 55);
    ctx.quadraticCurveTo(balloonX - 10, ropeY - 20, balloonX + 5, ropeY);
    ctx.stroke();

    // Balloon
    const balloonCharge = Math.min(1, chargeRef.current / 100);
    const glowIntensity = balloonCharge * 30;
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = `rgba(100, 150, 255, ${balloonCharge * 0.8})`;

    const balloonGrad = ctx.createRadialGradient(
      balloonX - 15,
      balloonY - 20,
      5,
      balloonX,
      balloonY,
      55,
    );
    balloonGrad.addColorStop(
      0,
      `rgba(${150 - balloonCharge * 60}, ${160 - balloonCharge * 40}, 255, 0.95)`,
    );
    balloonGrad.addColorStop(
      0.7,
      `rgba(${80 - balloonCharge * 40}, ${100 - balloonCharge * 30}, 220, 0.9)`,
    );
    balloonGrad.addColorStop(1, `rgba(${40}, ${60}, 180, 0.85)`);

    ctx.beginPath();
    ctx.ellipse(balloonX, balloonY, 50, 60, 0, 0, Math.PI * 2);
    ctx.fillStyle = balloonGrad;
    ctx.fill();
    ctx.strokeStyle = `rgba(100, 150, 255, ${0.3 + balloonCharge * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Balloon knot
    ctx.beginPath();
    ctx.arc(balloonX, balloonY + 57, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(60, 80, 200, 0.8)";
    ctx.fill();

    // Balloon label
    ctx.fillStyle = "rgba(200, 220, 255, 0.8)";
    ctx.font = "bold 13px Bricolage Grotesque, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Balloon", balloonX, balloonY - 65);
    ctx.font = "11px Sora, sans-serif";
    ctx.fillStyle = `rgba(100, 160, 255, ${0.3 + balloonCharge * 0.7})`;
    ctx.fillText(
      `Charge: ${chargeRef.current > 0 ? "-" : ""}${Math.abs(chargeRef.current).toFixed(0)} units`,
      balloonX,
      balloonY + 80,
    );

    // Rubber rod / sweater
    const rodGrad = ctx.createLinearGradient(
      rodX - 15,
      h * 0.3,
      rodX + 15,
      h * 0.3,
    );
    rodGrad.addColorStop(0, "rgba(120, 60, 30, 0.9)");
    rodGrad.addColorStop(0.5, "rgba(180, 90, 40, 0.95)");
    rodGrad.addColorStop(1, "rgba(100, 50, 25, 0.9)");
    ctx.fillStyle = rodGrad;
    ctx.beginPath();
    ctx.roundRect(rodX - 12, h * 0.3, 24, h * 0.4, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(200, 120, 60, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "rgba(200, 150, 100, 0.8)";
    ctx.font = "bold 12px Bricolage Grotesque, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Rubber Rod", rodX, h * 0.3 - 10);

    // Electric field lines between objects (when charged)
    if (chargeRef.current > 10) {
      const strength = chargeRef.current / 100;
      const numLines = Math.floor(strength * 8);
      for (let i = 0; i < numLines; i++) {
        const t = (i + 1) / (numLines + 1);
        const startX = balloonX + 52;
        const startY = balloonY - 40 + t * 80;
        const endX = rodX - 13;
        const endY = h * 0.3 + t * h * 0.4;

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = `rgba(100, 180, 255, ${strength * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
          (startX + endX) / 2,
          (startY + endY) / 2 - 20,
          endX,
          endY,
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Small arrowhead
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        const mx = (startX + endX) / 2;
        const my = (startY + endY) / 2 - 10;
        ctx.fillStyle = `rgba(100, 180, 255, ${strength * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(mx + 6 * Math.cos(angle), my + 6 * Math.sin(angle));
        ctx.lineTo(
          mx - 5 * Math.cos(angle - 0.4),
          my - 5 * Math.sin(angle - 0.4),
        );
        ctx.lineTo(
          mx - 5 * Math.cos(angle + 0.4),
          my - 5 * Math.sin(angle + 0.4),
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    // Instructions
    if (!isRubbingRef.current && chargeRef.current < 5) {
      ctx.fillStyle = "rgba(100, 140, 200, 0.4)";
      ctx.font = "14px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Move your mouse over the rod to rub it!", w / 2, h * 0.85);
    }

    // Sparks
    sparksRef.current = sparksRef.current.filter((s) => s.life < s.maxLife);
    for (const spark of sparksRef.current) {
      const progress = spark.life / spark.maxLife;
      const alpha = 1 - progress;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `${spark.color}, ${alpha * 0.8})`;
      ctx.fillStyle = `${spark.color}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(
        spark.x,
        spark.y,
        spark.size * (1 - progress * 0.5),
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Spark trail
      ctx.strokeStyle = `${spark.color}, ${alpha * 0.5})`;
      ctx.lineWidth = spark.size * 0.4;
      ctx.beginPath();
      ctx.moveTo(spark.x - spark.vx * 3, spark.y - spark.vy * 3);
      ctx.lineTo(spark.x, spark.y);
      ctx.stroke();

      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.08; // gravity
      spark.vx *= 0.97;
      spark.life++;
    }

    // Charge indicators
    chargeIndicatorsRef.current = chargeIndicatorsRef.current.filter(
      (c) => c.age < 30,
    );
    for (const ind of chargeIndicatorsRef.current) {
      const alpha = 1 - ind.age / 30;
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
      ctx.font = `${12 - ind.age * 0.2}px Sora, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("−", ind.x, ind.y - ind.age * 1.5);
      ind.age++;
    }

    ctx.shadowBlur = 0;

    rafRef.current = requestAnimationFrame(draw);
  }, []);

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

  const isOverRod = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rodX = canvas.width * 0.65;
    const rodTop = canvas.height * 0.3;
    const rodBottom = canvas.height * 0.7;
    return Math.abs(x - rodX) < 25 && y > rodTop - 10 && y < rodBottom + 10;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCanvasPos(e);
    const overRod = isOverRod(x, y);
    isRubbingRef.current = overRod;

    if (overRod && lastPosRef.current) {
      const speed = Math.hypot(
        x - lastPosRef.current.x,
        y - lastPosRef.current.y,
      );
      rubSpeedRef.current = speed;
      if (speed > 3) {
        const gain = Math.min(speed * 0.5, 2);
        chargeRef.current = Math.min(100, chargeRef.current + gain);
        setCharge(Math.round(chargeRef.current));
        spawnSparks(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20,
          speed / 15,
        );
      }
    }

    lastPosRef.current = { x, y };
  };

  const onMouseLeave = () => {
    isRubbingRef.current = false;
    lastPosRef.current = null;
  };

  // Slowly discharge
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRubbingRef.current) {
        chargeRef.current = Math.max(0, chargeRef.current - 0.3);
        setCharge(Math.round(chargeRef.current));
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const chargePercent = Math.round(charge);
  const chargeLevel =
    charge > 70
      ? "High"
      : charge > 35
        ? "Medium"
        : charge > 10
          ? "Low"
          : "None";
  const chargeLevelColor =
    charge > 70
      ? "oklch(0.78 0.18 85)"
      : charge > 35
        ? "oklch(0.72 0.2 235)"
        : "oklch(0.55 0.03 240)";

  return (
    <section id="static" className="py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at 30% 60%, oklch(0.12 0.06 250 / 0.6) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader
          badge="⚡ Simulation 4"
          title="Static"
          titleAccent="Electricity"
          description="Move your mouse over the rubber rod to rub it against the balloon. Watch the static charge build up and electric field lines form."
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
                  Charge Transfer Demo
                </span>
                <span className="text-xs text-muted-foreground/60">
                  Move mouse over rod to rub
                </span>
              </div>
              <canvas
                ref={canvasRef}
                data-ocid="static.canvas_target"
                className="w-full select-none"
                style={{
                  height: "380px",
                  background: "oklch(0.07 0.015 265)",
                  cursor: "crosshair",
                }}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
              />
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col gap-4">
            {/* Charge meter */}
            <div
              className="rounded-xl p-5"
              style={{
                border: "1px solid oklch(0.82 0.17 198 / 0.4)",
                background: "oklch(0.08 0.01 265 / 0.9)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                Charge Buildup
              </div>
              <div className="flex items-end justify-between mb-3">
                <span
                  className="text-3xl font-display font-black"
                  style={{ color: chargeLevelColor }}
                >
                  {chargePercent}%
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: chargeLevelColor }}
                >
                  {chargeLevel}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${chargePercent}%`,
                    background:
                      "linear-gradient(to right, oklch(0.72 0.2 235), oklch(0.82 0.18 85))",
                    boxShadow:
                      chargePercent > 30
                        ? "0 0 10px oklch(0.72 0.2 235 / 0.5)"
                        : "none",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/60 mt-1.5">
                <span>Neutral</span>
                <span>Fully Charged</span>
              </div>
            </div>

            {/* Triboelectric series */}
            <div
              className="rounded-xl p-4"
              style={{
                border: "1px solid oklch(0.82 0.17 198 / 0.3)",
                background: "oklch(0.08 0.01 265 / 0.8)",
              }}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Triboelectric Series
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { material: "Human skin", charge: "+", intensity: 3 },
                  { material: "Glass", charge: "+", intensity: 2.5 },
                  { material: "Nylon", charge: "+", intensity: 2 },
                  { material: "Rubber (balloon)", charge: "−", intensity: 2 },
                  { material: "Silicone", charge: "−", intensity: 2.5 },
                  { material: "PTFE (Teflon)", charge: "−", intensity: 3 },
                ].map((item) => (
                  <div
                    key={item.material}
                    className="flex items-center justify-between"
                  >
                    <span className="text-muted-foreground/80">
                      {item.material}
                    </span>
                    <span
                      className="font-bold px-1.5 py-0.5 rounded text-xs"
                      style={{
                        background:
                          item.charge === "+"
                            ? "rgba(255,120,120,0.2)"
                            : "rgba(100,150,255,0.2)",
                        color: item.charge === "+" ? "#ff8080" : "#80a0ff",
                      }}
                    >
                      {item.charge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-xl p-4 bg-muted/10 border border-border text-xs text-muted-foreground space-y-2">
              <p>• Rub the rod faster for more charge</p>
              <p>• Charge slowly dissipates over time</p>
              <p>• Field lines appear when charge is high</p>
              <p>• Real effect: rubber picks up electrons from wool</p>
            </div>
          </div>
        </div>

        {/* Educational cards */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Triboelectric Effect",
              text: "When two different materials rub together, electrons transfer between them. One material becomes positively charged, the other negatively charged.",
            },
            {
              title: "Charge Conservation",
              text: "The total charge in an isolated system remains constant. When rubber steals electrons from wool, the total charge before and after remains zero.",
            },
            {
              title: "Electrostatic Discharge",
              text: "Built-up charges neutralize rapidly when a conductive path forms — the spark you see is electrons jumping the gap, ionizing the air into a plasma.",
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
