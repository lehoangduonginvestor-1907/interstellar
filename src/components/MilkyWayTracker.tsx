"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { checkMilkyWayVisibility } from "@/utils/skyOptics";

interface MilkyWayTrackerProps {
    altSagittariusA: number;
    dynamicSqmZenith: number;
    riseTime?: string;
    setTime?: string;
    bestWindow?: string;
    className?: string;
}

export function MilkyWayTracker({
    altSagittariusA,
    dynamicSqmZenith,
    riseTime = "22:45",
    setTime = "04:15",
    bestWindow = "00:00 - 02:30",
    className
}: MilkyWayTrackerProps) {

    const visibility = checkMilkyWayVisibility(altSagittariusA, dynamicSqmZenith);

    return (
        <Card className={cn("bg-card/50 backdrop-blur-md border-border/50", className)}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold tracking-wide">
                    Milky Way Tracker
                </CardTitle>
                <Badge variant={visibility.isVisible ? "default" : "destructive"}>
                    {visibility.isVisible ? "VISIBLE" : "POOR CONDITIONS"}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">

                <p className="text-sm font-medium text-muted-foreground">
                    {visibility.reason}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Galactic Center Alt</span>
                        <p className="text-xl font-semibold tracking-tight">
                            {altSagittariusA.toFixed(1)}°
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Zenith SQM</span>
                        <p className="text-xl font-semibold tracking-tight">
                            {dynamicSqmZenith.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="bg-muted/40 rounded-lg p-3 mt-4 flex items-center justify-between border border-border/40">
                    <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rise/Set</span>
                        <p className="text-sm font-mono">{riseTime} / {setTime}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-primary/80 uppercase tracking-wider font-bold">Optimal Window</span>
                        <p className="text-sm font-mono text-primary">{bestWindow}</p>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
