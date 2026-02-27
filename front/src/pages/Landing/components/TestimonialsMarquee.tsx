import { AppImage } from "./AppImage";

const testimonials = [
  {
    key: "1",
    quote:
      "PharmaERP cut our batch release cycle from 5 days to 18 hours. The audit trail alone saved us during our last FDA inspection.",
    name: "Dr. Rebecca Harmon",
    role: "VP Quality Assurance",
    company: "Nexagen Pharmaceuticals",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_1a2ba86fa-1768293354155.png",
  },
  {
    key: "2",
    quote:
      "We evaluated six ERP vendors. PharmaERP was the only one that understood GMP documentation without needing three months of customization.",
    name: "Marcus Webb",
    role: "Director of Manufacturing IT",
    company: "Crestfield Biopharma",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_18c66c46c-1763301780768.png",
  },
  {
    key: "3",
    quote:
      "OOS investigation workflows used to take our QC team two days of paperwork. Now it's 45 minutes end-to-end, fully documented.",
    name: "Priya Nambiar",
    role: "Head of Quality Control",
    company: "BioAxis India Ltd.",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_1a7faa8af-1768193479865.png",
  },
  {
    key: "4",
    quote:
      "The SAP bridge worked on day one. No data migration nightmares. Our team was fully operational within six weeks of signing.",
    name: "Thomas Gruber",
    role: "CIO",
    company: "Helvetica Pharma AG",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_123389999-1768649603951.png",
  },
  {
    key: "5",
    quote:
      "99.97% uptime isn't a marketing claim for us — we've been live for three years and never missed a batch release deadline due to system downtime.",
    name: "Sandra Okonkwo",
    role: "COO",
    company: "AfriMed Manufacturing",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_1398d60d1-1771689255145.png",
  },
  {
    key: "6",
    quote:
      "Supply chain visibility went from spreadsheets to real-time dashboards. We caught a vendor CoC issue before it hit the production floor.",
    name: "James Callahan",
    role: "Supply Chain Director",
    company: "Meridian Generics Inc.",
    avatar:
      "https://img.rocket.new/generatedImages/rocket_gen_img_165854586-1769333400791.png",
  },
];

function TestimonialCard({
  quote,
  name,
  role,
  company,
  avatar,
}: (typeof testimonials)[0]) {
  return (
    <div className="w-[380px] h-[220px] glass card-glow rounded-2xl p-7 flex flex-col justify-between shrink-0 transition-all duration-500 cursor-default hover:border-foreground/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:scale-[1.02] bg-bg-card/50">
      <p className="text-muted text-sm font-light leading-relaxed line-clamp-3">
        "{quote}"
      </p>
      <div className="flex items-center gap-3 border-t border-foreground/5 pt-4 mt-2">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-foreground/10 shrink-0">
          <AppImage
            src={avatar}
            alt={`${name}, ${role} at ${company}`}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-foreground text-xs font-semibold">
            {name}
          </div>
          <div className="font-mono text-[9px] text-muted">
            {role} · {company}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsMarquee() {
  const doubled = [...testimonials, ...testimonials];
  const row2 = [...testimonials.slice(3), ...testimonials.slice(0, 3)];
  const row2doubled = [...row2, ...row2];

  return (
    <section id="compliance" className="reveal-group py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-14">
        <span className="font-mono text-[10px] text-accent uppercase tracking-[0.25em] block mb-3">
          Client Results
        </span>
        <h2
          className="font-sans font-semibold tracking-tight leading-[0.9]"
          style={{ fontSize: "clamp(2.2rem, 4.5vw, 4rem)" }}
        >
          <span className="text-foreground block">
            Inspections passed.
          </span>
          <span className="text-muted block">
            Deadlines met.
          </span>
        </h2>
      </div>

      {/* Gradient masks */}
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--bg-base), transparent)",
          }}
        />

        <div
          className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, var(--bg-base), transparent)",
          }}
        />

        <div className="flex flex-col gap-5">
          {/* Row 1: left */}
          <div className="overflow-hidden">
            <div className="flex gap-5 animate-marquee-left marquee-track w-max pl-5 py-2">
              {doubled.map((t, i) => {
                const { key, ...testimonialProps } = t;
                return (
                  <TestimonialCard
                    key={`${key}-row1-${i}`}
                    {...testimonialProps}
                  />
                );
              })}
            </div>
          </div>
          {/* Row 2: right */}
          <div className="overflow-hidden">
            <div className="flex gap-5 animate-marquee-right marquee-track w-max pl-5 py-2">
              {row2doubled.map((t, i) => {
                const { key, ...testimonialProps } = t;
                return (
                  <TestimonialCard
                    key={`${key}-row2-${i}`}
                    {...testimonialProps}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
