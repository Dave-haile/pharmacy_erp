export default function CtaSection() {
  return (
    <section id="demo" className="reveal-group px-6 lg:px-12 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-foreground/5 bg-bg-card">
          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(10,77,104,0.5) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 50%, rgba(0,194,203,0.07) 0%, transparent 50%)",
              }}
            />
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-[0.08] dark:opacity-[0.08] light:opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(0,194,203,0.8) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          {/* Accent top border */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(0,194,203,0.6), transparent)",
            }}
          />

          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="font-mono text-[10px] text-accent uppercase tracking-[0.25em] block mb-4">
                Get Started
              </span>
              <h2
                className="font-sans font-semibold tracking-tight leading-[0.9] mb-6"
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
              >
                <span className="text-foreground block">
                  See PharmaERP
                </span>
                <span className="text-muted block">
                  in your environment.
                </span>
              </h2>
              <p className="text-muted text-sm leading-relaxed max-w-md mb-8">
                Book a 45-minute demo tailored to your manufacturing process.
                Our validation engineers will walk through batch records,
                regulatory submissions, and QC workflows specific to your
                product lines.
              </p>

              {/* Proof points */}
              <div className="flex flex-col gap-3">
                {[
                  "No generic demos — we map to your SOPs",
                  "Validation documentation included",
                  "Go-live timeline assessment at no cost",
                ]?.map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#00C2CB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span className="text-sm text-muted">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div className="glass rounded-2xl border border-foreground/5 p-8 card-glow bg-bg-card/50">
              <h3 className="text-foreground font-semibold text-lg mb-1">
                Request a Demo
              </h3>
              <p className="text-muted text-xs mb-6">
                We'll respond within one business day.
              </p>

              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => e?.preventDefault()}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Sarah"
                      className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Mitchell"
                      className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@nexagenpharma.com"
                    className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    placeholder="Nexagen Pharmaceuticals"
                    className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5">
                    Primary Interest
                  </label>
                  <select className="w-full bg-foreground/[0.04] border border-foreground/10 rounded-lg px-4 py-2.5 text-sm text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all appearance-none">
                    <option
                      value=""
                      className="bg-bg-card"
                    >
                      Select a module...
                    </option>
                    <option
                      value="batch"
                      className="bg-bg-card"
                    >
                      Batch Management
                    </option>
                    <option
                      value="qc"
                      className="bg-bg-card"
                    >
                      Quality Control / LIMS
                    </option>
                    <option
                      value="regulatory"
                      className="bg-bg-card"
                    >
                      Regulatory Compliance
                    </option>
                    <option
                      value="supply"
                      className="bg-bg-card"
                    >
                      Supply Chain
                    </option>
                    <option
                      value="full"
                      className="bg-bg-card"
                    >
                      Full Platform
                    </option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="group w-full mt-2 px-6 py-3.5 rounded-full bg-accent text-white text-sm font-bold tracking-wide hover:bg-accent/90 transition-all hover:shadow-[0_0_32px_rgba(0,194,203,0.35)] active:scale-95 flex items-center justify-center gap-2"
                >
                  Book My Demo
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
                </button>
                <p className="text-center font-mono text-[9px] text-muted/50">
                  No spam. Unsubscribe anytime. SOC 2 Type II certified.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
