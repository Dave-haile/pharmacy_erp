export default function Footer() {
  return (
    <footer className="bg-bg-card border-t border-foreground/5 pt-20 pb-10 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Pharma<span className="text-accent">Ops</span>
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              The next-generation ERP for pharmaceutical manufacturing. Validated, secure, and built for the future of life sciences.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">
              Product
            </h4>
            <ul className="space-y-4">
              {["Batch Tracking", "Quality Control", "Inventory", "Regulatory"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted hover:text-accent transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">
              Company
            </h4>
            <ul className="space-y-4">
              {["About Us", "Careers", "Security", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted hover:text-accent transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">
              Legal
            </h4>
            <ul className="space-y-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "SLA"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted hover:text-accent transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-foreground/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted/60 font-mono">
            © 2026 PharmaOps Systems Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
              FDA 21 CFR Part 11 Validated
            </span>
            <div className="flex gap-4">
              {/* Social icons placeholder */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-pointer"
                >
                  <div className="w-3 h-3 bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
