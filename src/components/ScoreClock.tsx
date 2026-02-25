"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScoreClockProps {
    score: number;
    isVetoed: boolean;
    vetoReason?: string;
    className?: string;
    size?: number;
}

export function ScoreClock({ score, isVetoed, vetoReason, className, size = 180 }: ScoreClockProps) {
    const radius = (size - 20) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let colorClass = "text-chart-1"; // Blue by default
    if (isVetoed) colorClass = "text-destructive"; // Red
    else if (score >= 80) colorClass = "text-chart-3"; // Green
    else if (score >= 60) colorClass = "text-chart-5"; // Yellow/Orange

    return (
        <div className={cn("relative flex flex-col items-center justify-center", className)}>
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <svg className="absolute -rotate-90 transform" width={size} height={size}>
                    <circle
                        className="text-muted/30"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={cn("transition-all duration-1000 ease-in-out", colorClass)}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={isVetoed ? circumference : strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                <div className="flex flex-col items-center justify-center absolute text-center space-y-1">
                    {isVetoed ? (
                        <span className="text-3xl font-bold tracking-tight text-destructive">Không</span>
                    ) : (
                        <span className="text-5xl font-extrabold tracking-tighter text-foreground">
                            {score}
                        </span>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Astro Score
                    </span>
                </div>
            </div>
            {isVetoed && vetoReason && (
                <p className="mt-4 text-sm font-medium text-destructive max-w-[200px] text-center">
                    {vetoReason}
                </p>
            )}
        </div>
    );
}
