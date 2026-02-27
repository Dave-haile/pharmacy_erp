import React from "react";
import { ShieldCheck, Lock, Eye, Server, Cpu, Globe } from "lucide-react";

const SECURITY_FEATURES = [
    {
        icon: ShieldCheck,
        title: "SOC 2 Type II Certified",
        description: "Independently audited security controls ensuring your data is protected by industry-leading standards.",
    },
    {
        icon: Lock,
        title: "End-to-End Encryption",
        description: "AES-256 encryption at rest and TLS 1.3 in transit. Your intellectual property never leaves the secure tunnel.",
    },
    {
        icon: Eye,
        title: "Immutable Audit Trails",
        description: "Every action is timestamped and attributed. Compliant with FDA 21 CFR Part 11 and EU Annex 11.",
    },
    {
        icon: Server,
        title: "Regional Data Residency",
        description: "Choose your hosting region (US, EU, APAC) to satisfy local data sovereignty and GDPR requirements.",
    },
    {
        icon: Cpu,
        title: "High Availability",
        description: "Multi-zone redundancy with 99.97% uptime guarantee. Automated failover and real-time backups.",
    },
    {
        icon: Globe,
        title: "Global Compliance",
        description: "Pre-configured templates for FDA, EMA, MHRA, and WHO regulatory frameworks.",
    },
];

export default function SecuritySection() {
    return (
        <section className="reveal-group py-24 px-6 lg:px-12 bg-bg-card/30 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20">
                    <span className="font-mono text-[10px] text-accent uppercase tracking-[0.25em] block mb-3">
                        Trust & Infrastructure
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                        Enterprise-Grade <span className="text-accent">Security</span>
                    </h2>
                    <p className="text-muted max-w-2xl mx-auto text-lg">
                        We understand that in Life Sciences, data integrity is as critical as product quality. Our platform is built on a foundation of absolute trust.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                    {SECURITY_FEATURES.map((feature, i) => (
                        <div key={i} className="flex gap-6 group">
                            <div className="shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-bg-base transition-all duration-300">
                                    <feature.icon className="w-6 h-6 text-accent group-hover:text-inherit" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-muted text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 p-8 rounded-3xl border border-accent/20 bg-accent/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Validation Ready</h4>
                            <p className="text-xs text-muted">IQ/OQ/PQ documentation provided with every deployment.</p>
                        </div>
                    </div>
                    <button className="px-8 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-all active:scale-95">
                        Download Security Whitepaper
                    </button>
                </div>
            </div>
        </section>
    );
}
