import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

const STEPS = [
    {
        id: "01",
        title: "Material Dispensing",
        description: "Automated weight verification and barcode scanning ensures 100% ingredient accuracy before production begins.",
        tags: ["Barcode Sync", "Scale Integration"],
    },
    {
        id: "02",
        title: "Manufacturing Execution",
        description: "Real-time eBR guidance for operators with mandatory checkpoints and automated deviation detection.",
        tags: ["eBR", "Real-time Alerts"],
    },
    {
        id: "03",
        title: "Quality Control",
        description: "Integrated LIMS workflows for in-process and final testing. Automated OOS investigation triggers.",
        tags: ["LIMS", "OOS Workflows"],
    },
    {
        id: "04",
        title: "Batch Release",
        description: "One-click 'Release by Exception' reviews. Electronic signatures compliant with 21 CFR Part 11.",
        tags: ["E-Signatures", "Audit Ready"],
    },
];

export default function WorkflowSection() {
    return (
        <section id="solutions" className="reveal-group py-24 px-6 lg:px-12 bg-bg-base relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <span className="font-mono text-[10px] text-accent uppercase tracking-[0.25em] block mb-3">
                        The Lifecycle
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                        From Raw Material to <span className="text-accent">Validated Release</span>
                    </h2>
                    <p className="text-muted max-w-2xl text-lg">
                        PharmaOps digitizes the entire manufacturing process, ensuring every step is documented, validated, and compliant.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="relative group">
                            {/* Connector Line */}
                            {index < STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-8 left-full w-full h-[1px] bg-foreground/5 z-0 -translate-x-4">
                                    <div className="absolute top-1/2 right-0 -translate-y-1/2">
                                        <ArrowRight className="w-4 h-4 text-foreground/10" />
                                    </div>
                                </div>
                            )}

                            <div className="relative z-10 glass p-8 rounded-3xl border border-foreground/5 hover:border-accent/30 transition-all duration-500 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="font-mono text-3xl font-bold text-accent/20 group-hover:text-accent/40 transition-colors">
                                        {step.id}
                                    </span>
                                    <CheckCircle2 className="w-6 h-6 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-4">
                                    {step.title}
                                </h3>

                                <p className="text-muted text-sm leading-relaxed mb-6 flex-grow">
                                    {step.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {step.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-mono text-muted uppercase tracking-wider">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
