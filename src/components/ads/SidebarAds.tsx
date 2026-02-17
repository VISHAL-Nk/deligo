"use client";

import AdUnit from "./AdUnit";

interface SidebarAdsProps {
    leftSlot?: string;
    rightSlot?: string;
    children: React.ReactNode;
}

export default function SidebarAds({
    leftSlot = "YOUR_LEFT_SIDEBAR_SLOT",
    rightSlot = "YOUR_RIGHT_SIDEBAR_SLOT",
    children,
}: SidebarAdsProps) {
    return (
        <div className="relative">
            {/* Left sidebar ad — only on xl screens */}
            <div className="hidden xl:block fixed left-0 top-1/2 -translate-y-1/2 z-10 w-[160px] pl-2">
                <div className="sticky top-24">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block text-center mb-1">
                        Ad
                    </span>
                    <AdUnit
                        slot={leftSlot}
                        format="vertical"
                        responsive={false}
                        style={{ width: "160px", height: "600px" }}
                        className="rounded-lg shadow-sm"
                    />
                </div>
            </div>

            {/* Main content */}
            <div className="w-full">
                {children}
            </div>

            {/* Right sidebar ad — only on xl screens */}
            <div className="hidden xl:block fixed right-0 top-1/2 -translate-y-1/2 z-10 w-[160px] pr-2">
                <div className="sticky top-24">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block text-center mb-1">
                        Ad
                    </span>
                    <AdUnit
                        slot={rightSlot}
                        format="vertical"
                        responsive={false}
                        style={{ width: "160px", height: "600px" }}
                        className="rounded-lg shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
}
