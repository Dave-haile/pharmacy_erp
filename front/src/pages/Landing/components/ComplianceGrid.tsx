import React from "react";
import { AppImage } from "./AppImage";

const modules = [
  {
    tag: "Batch Management",
    title: "Full batch lifecycle from dispensing to release",
    body: "Track every gram of every ingredient across manufacturing, in-process QC, and final product release. Deviation alerts fire in real time.",
    icon: "M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10",
    span: "col-span-2 row-span-1",
    accent: "#00C2CB",
    image: "https://images.unsplash.com/photo-1579881615631-1fee6d4c75d4",
  },
  {
    tag: "Regulatory",
    title: "21 CFR Part 11 & GMP built-in",
    body: "Electronic signatures, audit trails, and access controls that satisfy FDA, EMA, and WHO inspections without custom configuration.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    span: "col-span-1 row-span-2",
    accent: "#34d399",
    image: null,
  },
  {
    tag: "Quality Control",
    title: "LIMS-integrated QC workflows",
    body: "Specifications, sampling plans, OOS investigations, and CoA generation — all linked to the batch record.",
    icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2h2",
    span: "col-span-1 row-span-1",
    accent: "#a78bfa",
    image: null,
  },
  {
    tag: "Supply Chain",
    title: "Vendor qualification & material traceability",
    body: "From approved supplier list to warehouse receipt to dispensing — full chain of custody with automated CoC verification.",
    icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
    span: "col-span-1 row-span-1",
    accent: "#f59e0b",
    image: null,
  },
  {
    tag: "ERP Integration",
    title: "SAP, Oracle & legacy system bridges",
    body: "Pre-built connectors for major ERP platforms. REST APIs and HL7 FHIR for clinical systems. Go live in weeks, not months.",
    icon: "M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z",
    span: "col-span-2 row-span-1",
    accent: "#00C2CB",
    image:
      "https://img.rocket.new/generatedImages/rocket_gen_img_1e66b31d7-1768651559788.png",
  },
];

export default function ComplianceGrid() {
  return (
    <section
      id="platform"
      className="reveal-group px-6 lg:px-12 py-24 lg:py-32"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="font-mono text-[10px] text-accent uppercase tracking-[0.25em] mb-3 block">
              Platform Modules
            </span>
            <h2
              className="font-sans font-semibold tracking-tight leading-[0.9]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
            >
              <span className="block text-foreground">
                <CharRevealInline text="Every workflow," />
              </span>
              <span className="block text-muted">
                <CharRevealInline text="validated." delay={0.2} />
              </span>
            </h2>
          </div>
          <p
            className="reveal-blur text-sm text-muted max-w-xs leading-relaxed font-mono"
            style={{ transitionDelay: "0.3s" }}
          >
            // Batch · Quality · Regulatory · Supply · Integration
          </p>
        </div>

        {/* Bento Grid */}
        <div className="stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
          {modules.map((mod) => (
            <div
              key={mod.tag}
              className={`hover-shine card-glow rounded-2xl border border-foreground/5 bg-bg-card relative overflow-hidden group transition-all duration-500 hover:border-foreground/10 hover:shadow-[0_0_40px_rgba(0,0,0,0.6)] ${mod.span}`}
            >
              {/* Background image for image cards */}
              {mod.image && (
                <>
                  <AppImage
                    src={mod.image}
                    alt={`${mod.tag} module background showing pharmaceutical operations`}
                    fill
                    className="transition-all duration-500 object-cover opacity-20 group-hover:opacity-30 scale-105 group-hover:scale-100"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-bg-card via-bg-card/80 to-bg-card/20 light:from-white light:via-white/80 light:to-white/20" />
                </>
              )}

              {/* Accent top line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${mod.accent}40, transparent)`,
                }}
              />

              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                {/* Top: tag + icon */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border"
                      style={{
                        background: `${mod.accent}15`,
                        borderColor: `${mod.accent}30`,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={mod.accent}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={mod.icon} />
                      </svg>
                    </div>
                    <span
                      className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: mod.accent }}
                    >
                      {mod.tag}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-foreground/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="stroke-foreground"
                    >
                      <path d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </div>
                </div>

                {/* Bottom: title + body */}
                <div>
                  <h3 className="text-foreground font-semibold text-base leading-snug mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-muted text-xs leading-relaxed line-clamp-2">
                    {mod.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CharRevealInline({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="char-reveal"
          style={{ transitionDelay: `${delay + i * 0.02}s` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </>
  );
}
