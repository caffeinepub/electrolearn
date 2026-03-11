import { Button } from "@/components/ui/button";
import { ChevronDown, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const QUOTES = [
  {
    text: "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.",
    author: "Nikola Tesla",
  },
  {
    text: "The most beautiful thing we can experience is the mysterious. It is the source of all true art and science.",
    author: "Albert Einstein",
  },
  {
    text: "Electricity is really just organized lightning.",
    author: "George Carlin",
  },
  {
    text: "The day science begins to study non-physical phenomena, it will make more progress in one decade than in all the previous centuries.",
    author: "Nikola Tesla",
  },
];

interface LightningBolt {
  points: { x: number; y: number }[];
  opacity: number;
  width: number;
  color: string;
  age: number;
  maxAge: number;
}

function generateLightning(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  roughness = 0.4,
  depth = 6,
): { x: number; y: number }[] {
  if (depth === 0)
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  const mx =
    (x1 + x2) / 2 +
    (Math.random() - 0.5) * roughness * Math.hypot(x2 - x1, y2 - y1);
  const my =
    (y1 + y2) / 2 +
    (Math.random() - 0.5) * roughness * Math.hypot(x2 - x1, y2 - y1);
  return [
    ...generateLightning(x1, y1, mx, my, roughness * 0.8, depth - 1),
    ...generateLightning(mx, my, x2, y2, roughness * 0.8, depth - 1).slice(1),
  ];
}

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boltsRef = useRef<LightningBolt[]>([]);
  const frameRef = useRef<number>(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "rgba(100, 180, 255",
      "rgba(200, 230, 255",
      "rgba(255, 230, 100",
    ];

    let lastSpawn = 0;
    const spawnInterval = 1800 + Math.random() * 2000;

    const spawnBolt = () => {
      if (!canvas) return;
      const startX = Math.random() * canvas.width;
      const endX = startX + (Math.random() - 0.5) * 200;
      const startY = 0;
      const endY = canvas.height * (0.3 + Math.random() * 0.4);
      const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
      boltsRef.current.push({
        points: generateLightning(startX, startY, endX, endY, 0.35, 7),
        opacity: 0.9,
        width: 1.5 + Math.random() * 2,
        color: colorBase,
        age: 0,
        maxAge: 18 + Math.floor(Math.random() * 12),
      });
      // Branch
      if (Math.random() > 0.4) {
        const bx = startX + (endX - startX) * (0.3 + Math.random() * 0.4);
        const by = startY + (endY - startY) * (0.3 + Math.random() * 0.3);
        boltsRef.current.push({
          points: generateLightning(
            bx,
            by,
            bx + (Math.random() - 0.5) * 150,
            by + Math.random() * 150,
            0.4,
            5,
          ),
          opacity: 0.6,
          width: 0.8,
          color: colorBase,
          age: 0,
          maxAge: 12 + Math.floor(Math.random() * 8),
        });
      }
    };

    const animate = (time: number) => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (time - lastSpawn > spawnInterval) {
        spawnBolt();
        lastSpawn = time + (Math.random() - 0.5) * 600;
      }

      boltsRef.current = boltsRef.current.filter(
        (bolt) => bolt.age < bolt.maxAge,
      );

      for (const bolt of boltsRef.current) {
        const fadeOut =
          bolt.age > bolt.maxAge * 0.5
            ? 1 - (bolt.age - bolt.maxAge * 0.5) / (bolt.maxAge * 0.5)
            : 1;
        const alpha = bolt.opacity * fadeOut;

        // Glow pass
        ctx.shadowBlur = 20;
        ctx.shadowColor = `${bolt.color}, ${alpha * 0.8})`;
        ctx.strokeStyle = `${bolt.color}, ${alpha})`;
        ctx.lineWidth = bolt.width + 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        bolt.points.forEach((pt, i) =>
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y),
        );
        ctx.stroke();

        // Core pass
        ctx.shadowBlur = 5;
        ctx.strokeStyle = `rgba(230, 245, 255, ${alpha})`;
        ctx.lineWidth = bolt.width * 0.4;
        ctx.beginPath();
        bolt.points.forEach((pt, i) =>
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y),
        );
        ctx.stroke();

        bolt.age++;
      }

      ctx.shadowBlur = 0;

      // Floating particles
      if (Math.random() > 0.85) {
        const px = Math.random() * canvas.width;
        const py = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 180, 255, ${Math.random() * 0.4 + 0.1})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const scrollToSimulations = () => {
    document.getElementById("coulomb")?.scrollIntoView({ behavior: "smooth" });
  };

  const quote = QUOTES[quoteIdx];

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Storm background */}
      <div className="absolute inset-0 storm-bg" />

      {/* Radial gradient centerpiece */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.12_0.06_250/0.6)_0%,transparent_60%)]" />

      {/* Canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Horizontal scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, oklch(0.72 0.2 235 / 0.15) 3px, oklch(0.72 0.2 235 / 0.15) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-electric-blue/40 bg-electric-blue/10 text-electric-blue text-xs font-medium tracking-widest uppercase mb-8">
          <Zap className="w-3 h-3 fill-current" />
          Interactive Educational Platform
          <Zap className="w-3 h-3 fill-current" />
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-6">
          <span className="block text-foreground">The Science of</span>
          <span
            className="block text-glow-blue"
            style={{ color: "oklch(0.72 0.2 235)" }}
          >
            Lightning &amp;
          </span>
          <span
            className="block text-glow-gold"
            style={{ color: "oklch(0.82 0.18 85)" }}
          >
            Electrostatics
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Explore the invisible forces that shape our universe — from the spark
          in your fingertip to the bolt that splits the sky. Interactive
          simulations for university-level physics.
        </p>

        {/* Quote card */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <div className="electric-border rounded-xl px-8 py-6 bg-deep-space/60 backdrop-blur-sm">
            <div className="text-electric-blue/60 text-4xl font-display leading-none mb-3">
              &ldquo;
            </div>
            <p className="text-foreground text-base md:text-lg italic font-light leading-relaxed mb-3 min-h-[3rem]">
              {quote.text}
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-electric-gold/60" />
              <span className="text-electric-gold text-sm font-medium tracking-wide">
                {quote.author}
              </span>
              <div className="h-px w-8 bg-electric-gold/60" />
            </div>
            {/* Quote indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {QUOTES.map((q, i) => (
                <button
                  key={q.author}
                  type="button"
                  onClick={() => setQuoteIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === quoteIdx
                      ? "bg-electric-blue w-4"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                  aria-label={`Quote ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          data-ocid="hero.cta.button"
          onClick={scrollToSimulations}
          size="lg"
          className="bg-electric-blue text-deep-space hover:bg-electric-cyan font-semibold px-8 py-6 text-base rounded-full glow-blue transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: "oklch(0.72 0.2 235)",
            color: "oklch(0.08 0.01 265)",
          }}
        >
          Explore Simulations
          <Zap className="ml-2 w-4 h-4 fill-current" />
        </Button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-6 h-6 text-muted-foreground/60" />
      </div>
    </section>
  );
}
