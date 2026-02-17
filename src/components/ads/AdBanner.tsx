"use client";

import AdUnit from "./AdUnit";

interface AdBannerProps {
    slot?: string;
    className?: string;
}

export default function AdBanner({ slot = "YOUR_AD_SLOT_ID", className = "" }: AdBannerProps) {
    return (
        <section className={`bg-gradient-to-r from-green-600 to-emerald-600 py-8 px-4 ${className}`} data-testid="ad-banner">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col items-center">
                    {/* Subtle ad label */}
                    <span className="text-green-200 text-xs font-medium uppercase tracking-wider mb-3">
                        — Sponsored —
                    </span>

                    {/* Ad unit */}
                    <div className="w-full max-w-4xl bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <AdUnit
                            slot={slot}
                            format="horizontal"
                            responsive={true}
                            style={{ minHeight: "100px" }}
                            className="rounded-lg overflow-hidden"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
