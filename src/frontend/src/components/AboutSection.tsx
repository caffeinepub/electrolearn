import { Award, BookOpen, Users, Zap } from "lucide-react";
import SectionHeader from "./SectionHeader";

const TEAM = [
  {
    name: "Pallela Harshith Reddy",
    roll: "25BEC073",
    role: "Lead Developer",
    initials: "PHR",
    color: "oklch(0.72 0.2 235)",
    bgColor: "rgba(100, 150, 255, 0.15)",
  },
  {
    name: "Aavula Karthikesh",
    roll: "25BEC002",
    role: "Simulations Engineer",
    initials: "AK",
    color: "oklch(0.82 0.18 85)",
    bgColor: "rgba(255, 200, 80, 0.15)",
  },
  {
    name: "Raj Vardhan",
    roll: "25BEC101",
    role: "UI & Content Design",
    initials: "RV",
    color: "oklch(0.82 0.17 198)",
    bgColor: "rgba(80, 210, 220, 0.15)",
  },
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-24 section-divider relative overflow-hidden"
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, oklch(0.12 0.05 250 / 0.4) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      {/* Decorative lightning */}
      <div
        className="absolute top-20 right-10 opacity-10 pointer-events-none"
        aria-hidden="true"
      >
        <Zap className="w-48 h-48" style={{ color: "oklch(0.72 0.2 235)" }} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <SectionHeader
          badge="About This Project"
          title="Created by"
          titleAccent="Team BEC"
          description="A university competition project exploring the intersection of physics education and interactive web technology."
          accentColor="gold"
        />

        {/* Project info card */}
        <div
          className="rounded-2xl p-6 mb-10 text-center"
          style={{
            border: "1px solid oklch(0.78 0.18 85 / 0.4)",
            background: "oklch(0.08 0.01 265 / 0.8)",
            boxShadow: "0 0 30px oklch(0.78 0.18 85 / 0.1)",
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.18 85)" }}
              />
              <span>University Competition Project</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen
                className="w-4 h-4"
                style={{ color: "oklch(0.72 0.2 235)" }}
              />
              <span>
                Department of Electronics &amp; Communication Engineering
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.17 198)" }}
              />
              <span>3 Members · B.E.C. Batch 2025</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
            <span
              className="font-semibold"
              style={{ color: "oklch(0.78 0.18 85)" }}
            >
              ElectroLearn
            </span>{" "}
            is an interactive educational platform built to demonstrate the
            fascinating physics of lightning and electrostatics through
            real-time HTML5 Canvas simulations and engaging visualizations.
          </p>
        </div>

        {/* Team cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {TEAM.map((member, i) => (
            <div
              key={member.roll}
              data-ocid={`about.team.item.${i + 1}`}
              className="group rounded-2xl p-6 transition-all duration-300 hover:scale-105"
              style={{
                border: `1px solid ${member.color}40`,
                background: member.bgColor,
                boxShadow: `0 4px 20px ${member.color}10`,
              }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-xl mb-4 mx-auto transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle, ${member.color}30, ${member.color}10)`,
                  border: `2px solid ${member.color}60`,
                  color: member.color,
                  boxShadow: `0 0 20px ${member.color}30`,
                }}
              >
                {member.initials}
              </div>

              {/* Info */}
              <div className="text-center">
                <h3 className="font-display font-bold text-base text-foreground mb-1 leading-tight">
                  {member.name}
                </h3>
                <div
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium mb-2"
                  style={{
                    background: `${member.color}20`,
                    color: member.color,
                  }}
                >
                  {member.roll}
                </div>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>

              {/* Decorative element */}
              <div
                className="mt-4 h-px mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(to right, transparent, ${member.color}, transparent)`,
                  maxWidth: "80%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Skills used */}
        <div
          className="rounded-2xl p-6"
          style={{
            border: "1px solid oklch(0.22 0.03 265)",
            background: "oklch(0.09 0.012 265 / 0.6)",
          }}
        >
          <h3 className="font-display font-bold text-lg text-center mb-5 text-foreground">
            Technologies &amp; Concepts
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "HTML5 Canvas API",
              "React 19",
              "TypeScript",
              "Coulomb's Law",
              "Electric Field Lines",
              "Vector Mathematics",
              "Lightning Physics",
              "Triboelectric Effect",
              "Tailwind CSS",
              "Interactive Simulations",
              "Responsive Design",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  border: "1px solid oklch(0.72 0.2 235 / 0.3)",
                  background: "oklch(0.72 0.2 235 / 0.08)",
                  color: "oklch(0.72 0.2 235 / 0.85)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
