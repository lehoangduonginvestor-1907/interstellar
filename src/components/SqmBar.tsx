"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SqmBarProps {
    sqm: number;
    className?: string;
}

export function SqmBar({ sqm, className }: SqmBarProps) {
    // Normalize SQM between 17 (terrible) and 22 (perfect)
    const minSqm = 17.0;
    const maxSqm = 22.0;

    let normalized = ((sqm - minSqm) / (maxSqm - minSqm)) * 100;
    normalized = Math.max(0, Math.min(100, normalized));

    let label = "City Sky";
    let colorClass = "bg-destructive";

    if (sqm >= 21.5) {
        label = "Pristine Dark Sky";
        colorClass = "bg-chart-4"; // Purple
    } else if (sqm >= 21.0) {
        label = "Excellent Dark Sky";
        colorClass = "bg-chart-1"; // Blue
    } else if (sqm >= 20.0) {
        label = "Rural Sky";
        colorClass = "bg-chart-3"; // Green
    } else if (sqm >= 19.0) {
        label = "Suburban Sky";
        colorClass = "bg-chart-5"; // Yellow/Orange
    } else if (sqm >= 18.0) {
        label = "Bright Suburban";
        colorClass = "bg-destructive"; // Red
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex justify-between items-baseline">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Dynamic SQM
                    </h3>
                    <p className="text-2xl font-bold tracking-tight mt-1">
                        {sqm.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">mag/arcsec²</span>
                    </p>
                </div>
                <div className="text-right">
                    <span className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-md",
                        "bg-muted text-muted-foreground border border-border"
                    )}>
                        {label}
                    </span>
                </div>
            </div>

            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-1000 ease-in-out", colorClass)}
                    style={{ width: `${normalized}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
                <span>17.0</span>
                <span>18.0</span>
                <span>19.0</span>
                <span>20.0</span>
                <span>21.0</span>
                <span>22.0</span>
            </div>
        </div>
    );
}
