interface SectionHeaderProps {
  badge: string;
  title: string;
  titleAccent?: string;
  description: string;
  accentColor?: "blue" | "gold" | "cyan";
}

export default function SectionHeader({
  badge,
  title,
  titleAccent,
  description,
  accentColor = "blue",
}: SectionHeaderProps) {
  const accentStyles = {
    blue: { color: "oklch(0.72 0.2 235)" },
    gold: { color: "oklch(0.82 0.18 85)" },
    cyan: { color: "oklch(0.82 0.17 198)" },
  };

  const badgeStyles = {
    blue: "border-electric-blue/40 bg-electric-blue/10 text-electric-blue",
    gold: "border-electric-gold/40 bg-electric-gold/10 text-electric-gold",
    cyan: "border-electric-cyan/40 bg-electric-cyan/10 text-electric-cyan",
  };

  return (
    <div className="text-center mb-12">
      <div
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-widest uppercase mb-6 ${badgeStyles[accentColor]}`}
      >
        {badge}
      </div>
      <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
        {title}{" "}
        {titleAccent && (
          <span style={accentStyles[accentColor]}>{titleAccent}</span>
        )}
      </h2>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
