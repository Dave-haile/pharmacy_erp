import { useEffect, useRef } from "react";

const HERO_WORDS_LINE1 = ["P", "h", "a", "r", "m", "a"];
const HERO_WORDS_LINE2 = ["O", "p", "s", ","];
const HERO_WORDS_LINE3 = ["C", "e", "r", "t", "i", "f", "i", "e", "d", "."];

function CharReveal({ chars, delay = 0 }: { chars: string[]; delay?: number }) {
  return (
    <>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="char-reveal"
          style={{ transitionDelay: `${delay + i * 0.025}s` }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function HeroSection() {
  const dotGridRef = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (dotGridRef.current) {
        dotGridRef.current.style.transform = `translateY(${scrolled * 0.15}px)`;
      }
      if (glow1Ref.current) {
        glow1Ref.current.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.05}px))`;
      }
      if (glow2Ref.current) {
        glow2Ref.current.style.transform = `translateY(${scrolled * -0.1}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="hero"
      className="reveal-group is-visible relative min-h-screen flex flex-col justify-center px-6 lg:px-12 pt-28 pb-20 overflow-hidden"
    >
      {/* Radial dot grid background */}
      <div
        ref={dotGridRef}
        className="absolute inset-0 z-0 opacity-[0.18] dark:opacity-[0.18] light:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,194,203,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at 60% 40%, black 0%, transparent 70%)",
        }}
      />

      {/* Deep ambient glow */}
      <div
        ref={glow1Ref}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, var(--glow-1) 0%, transparent 70%)",
        }}
      />
      <div
        ref={glow2Ref}
        className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, var(--glow-2) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* ─── Left: Typography ─── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Status badge */}
          <div
            className="reveal-blur flex items-center gap-2.5"
            style={{ transitionDelay: "0.1s" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="font-mono text-[10px] text-accent uppercase tracking-[0.2em]">
              FDA 21 CFR Part 11 Validated
            </span>
          </div>

          {/* Giant headline */}
          <h1
            className="font-sans font-semibold tracking-tight leading-[0.88] select-none"
            style={{ fontSize: "clamp(3.5rem, 9vw, 7.5rem)" }}
          >
            <span className="block hero-scan-text">
              <CharReveal chars={HERO_WORDS_LINE1} delay={0.15} />
            </span>
            <span
              className="block hero-scan-text"
              style={{ paddingLeft: "6%", animationDelay: "1s" }}
            >
              <CharReveal chars={HERO_WORDS_LINE2} delay={0.3} />
            </span>
            <span className="block" style={{ color: "rgb(var(--accent-bg))" }}>
              <CharReveal chars={HERO_WORDS_LINE3} delay={0.45} />
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="reveal-blur max-w-xl text-lg font-light leading-relaxed text-muted dark:text-muted light:text-gray-600"
            style={{ transitionDelay: "0.7s" }}
          >
            End-to-end ERP for pharmaceutical manufacturers. Batch tracking,
            regulatory submissions, quality control, and supply chain — unified
            in a single validated platform.
          </p>

          {/* CTAs */}
          <div
            className="reveal-blur flex flex-wrap items-center gap-4"
            style={{ transitionDelay: "0.9s" }}
          >
            <a
              href="#demo"
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-accent text-white text-sm font-bold tracking-wide hover:bg-accent/90 transition-all hover:shadow-[0_0_32px_rgba(0,194,203,0.4)] active:scale-95"
            >
              Request Demo
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform group-hover:translate-x-1"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="#platform"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-foreground/10 text-foreground text-sm font-medium hover:bg-foreground/5 transition-all"
            >
              Explore Platform
            </a>
          </div>

          {/* Trust logos */}
          <div
            className="reveal-blur flex items-center gap-4 pt-2"
            style={{ transitionDelay: "1.1s" }}
          >
            <span className="font-mono text-[10px] text-muted/60 dark:text-muted/60 light:text-gray-500 uppercase tracking-widest">
              Trusted by
            </span>
            {["FDA", "GMP", "ISO 15189", "ICH Q10"].map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 rounded-md border border-white/10 dark:border-white/10 light:border-gray-300 font-mono text-[10px] text-muted dark:text-muted light:text-gray-600 bg-white/[0.03] dark:bg-white/[0.03] light:bg-white"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Right: Dashboard Mockup ─── */}
        <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative pointer-events-none select-none">
          <div
            className="reveal-blur w-full"
            style={{ transitionDelay: "0.5s", perspective: "1200px" }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow:
                  "0 0 80px rgba(0,194,203,0.12), 0 0 200px rgba(10,77,104,0.3)",
              }}
            />

            {/* Dashboard card */}
            <div
              className="relative w-full aspect-[4/3] rounded-2xl border border-white/[0.07] bg-bg-card overflow-hidden shadow-2xl"
              style={{
                transform: "rotateY(-8deg) rotateX(4deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Scan line */}
              <div
                className="absolute left-0 w-full h-16 animate-sys-scan pointer-events-none z-20"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(0,194,203,0.06), transparent)",
                }}
              />

              {/* Top bar */}
              <div className="h-11 border-b border-white/[0.05] flex items-center px-4 gap-3 bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 mx-4 h-5 rounded-full bg-white/[0.04] flex items-center px-3 gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  <div className="w-24 h-1.5 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    style={{ boxShadow: "0 0 6px rgba(0,194,203,0.8)" }}
                  />
                  <span className="font-mono text-[9px] text-muted">Live</span>
                </div>
              </div>

              {/* Content area */}
              <div className="flex h-[calc(100%-44px)]">
                {/* Sidebar */}
                <div className="w-14 border-r border-white/[0.04] flex flex-col items-center py-4 gap-3 bg-white/[0.01]">
                  {[
                    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
                    "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
                    "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0 2 2h2",
                    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
                  ].map((path, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${i === 0 ? "bg-accent/20 border-accent/30" : "bg-white/[0.03] border-white/[0.04] hover:bg-white/[0.06]"}`}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={i === 0 ? "#00C2CB" : "rgba(255,255,255,0.3)"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={path} />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Main dashboard */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                  {/* Header row */}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-mono text-[8px] text-muted/60 uppercase tracking-wider mb-0.5">
                        Batch Overview
                      </div>
                      <div className="text-white text-sm font-semibold">
                        Q1 2026 Production
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
                      <span className="w-1 h-1 rounded-full bg-accent" />
                      <span className="font-mono text-[8px] text-accent">
                        GMP Compliant
                      </span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Batches Active",
                        value: "247",
                        delta: "+12",
                        color: "#00C2CB",
                      },
                      {
                        label: "QC Pass Rate",
                        value: "99.3%",
                        delta: "+0.4%",
                        color: "#34d399",
                      },
                      {
                        label: "Deviations",
                        value: "3",
                        delta: "-8",
                        color: "#f59e0b",
                      },
                    ].map(({ label, value, delta, color }) => (
                      <div
                        key={label}
                        className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]"
                      >
                        <div className="font-mono text-[7px] text-muted/60 uppercase tracking-wider mb-1">
                          {label}
                        </div>
                        <div
                          className="text-white font-bold text-base leading-none mb-1"
                          style={{ color }}
                        >
                          {value}
                        </div>
                        <div className="font-mono text-[8px]" style={{ color }}>
                          {delta}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chart placeholder */}
                  <div className="flex-1 bg-white/[0.02] rounded-lg border border-white/[0.04] p-3 relative overflow-hidden">
                    <div className="font-mono text-[7px] text-muted/60 uppercase tracking-wider mb-2">
                      Batch Release Trend
                    </div>
                    <svg
                      className="w-full"
                      height="60"
                      viewBox="0 0 280 60"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#00C2CB"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#00C2CB"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 50 C40 50,60 30,100 28 S160 20,200 15 S250 8,280 5 L280 60 L0 60Z"
                        fill="url(#chartFill)"
                      />
                      <path
                        d="M0 50 C40 50,60 30,100 28 S160 20,200 15 S250 8,280 5"
                        fill="none"
                        stroke="#00C2CB"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="200"
                        cy="15"
                        r="3"
                        fill="#030507"
                        stroke="#00C2CB"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="200"
                        cy="15"
                        r="7"
                        fill="#00C2CB"
                        opacity="0.2"
                      />
                    </svg>
                  </div>

                  {/* Recent batches list */}
                  <div className="space-y-1.5">
                    {[
                      {
                        id: "BTC-2026-0419",
                        product: "Amoxicillin 500mg",
                        status: "Released",
                        color: "#34d399",
                      },
                      {
                        id: "BTC-2026-0418",
                        product: "Metformin 850mg",
                        status: "QC Review",
                        color: "#f59e0b",
                      },
                    ].map(({ id, product, status, color }) => (
                      <div
                        key={id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03]"
                      >
                        <div>
                          <div className="font-mono text-[8px] text-muted/60">
                            {id}
                          </div>
                          <div className="text-[10px] text-white font-medium">
                            {product}
                          </div>
                        </div>
                        <span
                          className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                          style={{ color, background: `${color}18` }}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -left-6 animate-float-gentle glass card-glow rounded-xl px-4 py-3 flex items-center gap-3 z-10">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00C2CB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-bold text-foreground">
                FDA Audit Trail
              </div>
              <div className="font-mono text-[9px] text-muted">
                21 CFR Part 11
              </div>
            </div>
          </div>

          {/* Floating uptime badge */}
          <div
            className="absolute -top-4 -right-4 animate-float-gentle glass card-glow rounded-xl px-4 py-3 flex items-center gap-2 z-10"
            style={{ animationDelay: "1.5s" }}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-accent leading-none">
                99.97%
              </span>
              <span className="font-mono text-[9px] text-muted">
                Uptime SLA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-accent to-transparent" />
        <span className="font-mono text-[9px] text-muted uppercase tracking-widest">
          Scroll
        </span>
      </div>
    </section>
  );
}
