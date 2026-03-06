import React, { useEffect, useRef, useState } from "react";

const metrics = [
  {
    value: 500,
    suffix: "+",
    label: "Pharma Manufacturers",
    description: "across 40+ countries",
  },
  {
    value: 40,
    suffix: "M+",
    label: "Batches Tracked",
    description: "since platform launch",
  },
  {
    value: 99.97,
    suffix: "%",
    label: "Platform Uptime",
    description: "guaranteed SLA",
  },
  {
    value: 100,
    suffix: "%",
    label: "Audit Pass Rate",
    description: "for clients on validation plan",
  },
];

function Counter({
  target,
  suffix,
  duration = 2000,
}: {
  target: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const isDecimal = target % 1 !== 0;
    const steps = 60;
    const step = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(
        isDecimal ? Math.round(current * 100) / 100 : Math.round(current),
      );
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function MetricsStrip() {
  return (
    <section className="reveal-group border-t border-b border-white/10 py-20 px-6 lg:px-12 bg-bg-base relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,194,203,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,203,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="stagger-grid grid grid-cols-2 lg:grid-cols-4 gap-0">
          {metrics.map(({ value, suffix, label, description }, i) => (
            <div
              key={label}
              className={`group flex flex-col items-center text-center px-8 py-10 relative ${i < metrics.length - 1 ? "border-r border-foreground/5" : ""}`}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(0,194,203,0.05) 0%, transparent 70%)",
                }}
              />

              <div
                className="font-sans font-bold tracking-tight leading-none mb-2 text-transparent bg-clip-text"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  backgroundImage:
                    "linear-gradient(to bottom, var(--foreground), rgba(var(--text-primary), 0.4))",
                }}
              >
                <Counter target={value} suffix={suffix} />
              </div>
              <div className="text-white font-semibold text-sm mb-1">
                {label}
              </div>
              <div className="font-mono text-[10px] text-muted/60 uppercase tracking-wider">
                {description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
