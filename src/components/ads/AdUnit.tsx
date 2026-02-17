"use client";

import { useEffect, useRef } from "react";

interface AdUnitProps {
    slot: string;
    format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
    responsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
    layoutKey?: string;
}

declare global {
    interface Window {
        adsbygoogle: Array<Record<string, unknown>>;
    }
}

export default function AdUnit({
    slot,
    format = "auto",
    responsive = true,
    style,
    className = "",
    layoutKey,
}: AdUnitProps) {
    const adRef = useRef<HTMLModElement>(null);
    const isAdPushed = useRef(false);

    const publisherId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

    useEffect(() => {
        // Don't push ads on localhost or if no publisher ID
        if (!publisherId || publisherId.includes("XXXXXXXX")) {
            return;
        }

        if (isAdPushed.current) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isAdPushed.current = true;
        } catch (err) {
            console.error("AdSense error:", err);
        }
    }, [publisherId]);

    // Show placeholder in development or when no publisher ID
    if (!publisherId || publisherId.includes("XXXXXXXX")) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm ${className}`}
                style={{ minHeight: "90px", ...style }}
            >
                <div className="text-center">
                    <p className="font-medium">Ad Space</p>
                    <p className="text-xs mt-1">Google AdSense</p>
                </div>
            </div>
        );
    }

    return (
        <ins
            ref={adRef}
            className={`adsbygoogle ${className}`}
            style={{ display: "block", ...style }}
            data-ad-client={publisherId}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? "true" : "false"}
            {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
        />
    );
}
