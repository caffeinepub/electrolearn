import { Heart, Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-deep-space/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap
                className="w-6 h-6"
                style={{ color: "oklch(0.72 0.2 235)" }}
                fill="currentColor"
              />
            </div>
            <div>
              <div className="font-display font-bold text-base text-foreground">
                Electro
                <span style={{ color: "oklch(0.72 0.2 235)" }}>Learn</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Interactive Electrostatics Education
              </div>
            </div>
          </div>

          {/* Center info */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Created for University Competition &mdash; BEC Department
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Pallela Harshith Reddy · Aavula Karthikesh · Raj Vardhan
            </p>
          </div>

          {/* Copyright */}
          <div className="text-xs text-muted-foreground text-center md:text-right">
            <p>© {year} ElectroLearn.</p>
            <p className="mt-1 flex items-center gap-1 justify-center md:justify-end">
              Built with{" "}
              <Heart
                className="w-3 h-3 inline"
                style={{ color: "oklch(0.72 0.2 235)" }}
                fill="currentColor"
              />{" "}
              using{" "}
              <a
                href={caffeineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-200 underline underline-offset-2"
                style={{ color: "oklch(0.72 0.2 235 / 0.8)" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
