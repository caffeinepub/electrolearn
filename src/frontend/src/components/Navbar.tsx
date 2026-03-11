import { Menu, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { id: "home", label: "Home", href: "#home", ocid: "nav.home.link" },
  {
    id: "coulomb",
    label: "Coulomb's Law",
    href: "#coulomb",
    ocid: "nav.coulomb.link",
  },
  {
    id: "fields",
    label: "Electric Fields",
    href: "#fields",
    ocid: "nav.fields.link",
  },
  {
    id: "lightning",
    label: "Lightning",
    href: "#lightning",
    ocid: "nav.lightning.link",
  },
  {
    id: "static",
    label: "Static Electricity",
    href: "#static",
    ocid: "nav.static.link",
  },
  { id: "about", label: "About", href: "#about", ocid: "nav.about.link" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-deep-space/95 backdrop-blur-md border-b border-border shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-2 group"
            aria-label="ElectroLearn home"
          >
            <div className="relative">
              <Zap
                className="w-7 h-7 text-electric-blue group-hover:text-electric-gold transition-colors duration-300"
                fill="currentColor"
              />
              <span className="absolute inset-0 animate-electric-pulse rounded-full bg-electric-blue/20 blur-sm" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              Electro<span className="text-electric-blue">Learn</span>
            </span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  data-ocid={link.ocid}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(link.href);
                  }}
                  className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-electric-blue transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-electric-blue group-hover:w-full transition-all duration-300" />
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 text-muted-foreground hover:text-electric-blue transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-deep-space/98 backdrop-blur-md border-b border-border">
          <ul className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  data-ocid={link.ocid}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(link.href);
                  }}
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-electric-blue hover:bg-electric-blue/10 rounded-md transition-all duration-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
