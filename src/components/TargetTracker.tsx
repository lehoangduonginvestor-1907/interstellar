"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMoonSeparation, calculateAtmosphericRefraction, assessJetStreamRisk } from "@/utils/skyOptics";
import { AlertTriangle, Wind, Telescope } from "lucide-react";

interface TargetTrackerProps {
    targetName: string;
    targetAlt: number;
    targetAz: number;
    moonAlt: number;
    moonAz: number;
    windSpeed500hPa?: number; // km/h — from Open-Meteo 500hPa level
    tempCelsius?: number;
    className?: string;
}

export function TargetTracker({
    targetName, targetAlt, targetAz, moonAlt, moonAz,
    windSpeed500hPa = 0, tempCelsius = 25, className
}: TargetTrackerProps) {

    const separation = calculateMoonSeparation(moonAlt, moonAz, targetAlt, targetAz);

    // Airmass (Pickering 2002 — more accurate near horizon than simple secant)
    const zRadian = (90 - targetAlt) * (Math.PI / 180);
    let airmass = 1 / Math.cos(zRadian);
    if (airmass < 1) airmass = 1;
    if (airmass > 40) airmass = 40;

    // Moon interference
    let interferenceColor = "#34d399";
    let interferenceLabel = "Tối thiểu";
    if (separation < 15) { interferenceColor = "#f87171"; interferenceLabel = "Nghiêm trọng"; }
    else if (separation < 30) { interferenceColor = "#f97316"; interferenceLabel = "Đáng kể"; }
    else if (separation < 60) { interferenceColor = "#fbbf24"; interferenceLabel = "Nhẹ"; }

    // Atmospheric refraction & chromatic dispersion (Saemundsson 1986)
    const refraction = calculateAtmosphericRefraction(targetAlt, 1013, tempCelsius);

    // Jet Stream scintillation risk
    const jetStream = assessJetStreamRisk(windSpeed500hPa);

    return (
        <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 p-5", className)}
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))" }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Telescope className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-bold text-white">{targetName}</span>
                </div>
                <span className="text-[10px] border border-white/10 text-white/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Mục tiêu DSO</span>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Độ cao (Alt)</p>
                    <p className="text-2xl font-extrabold text-white tabular-nums">{targetAlt.toFixed(1)}<span className="text-sm text-white/40">°</span></p>
                    <p className="text-[10px] text-white/25 mt-0.5">Az: {targetAz.toFixed(1)}°</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[9px] uppercase tracking-widest text-white/30 mb-1">Airmass (X)</p>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: airmass > 3 ? "#f87171" : airmass > 2 ? "#fbbf24" : "#34d399" }}>
                        {airmass > 39 ? ">40" : airmass.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">{airmass > 3 ? "Chất lượng kém" : airmass > 2 ? "Trung bình" : "Tốt"}</p>
                </div>
            </div>

            {/* Moon separation */}
            <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] uppercase tracking-widest text-white/30">Cách Mặt Trăng (ρ)</p>
                    <span className="text-[10px] font-bold" style={{ color: interferenceColor }}>{interferenceLabel}</span>
                </div>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold tabular-nums" style={{ color: interferenceColor }}>{separation.toFixed(1)}°</span>
                    <span className="text-xs text-white/30">{moonAlt > 0 ? `🌙 Trăng ở ${moonAlt.toFixed(1)}°` : "🌑 Trăng đã lặn"}</span>
                </div>
            </div>

            {/* Jet Stream */}
            <div className="flex items-start gap-2 rounded-xl p-3 mb-2"
                style={{ background: `${jetStream.color}0d`, border: `1px solid ${jetStream.color}25` }}>
                <Wind className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: jetStream.color }} />
                <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: `${jetStream.color}80` }}>Jet Stream 500 hPa</p>
                    <p className="text-[11px] font-semibold" style={{ color: jetStream.color }}>{jetStream.message}</p>
                    {jetStream.fwhmBloatArcsec > 0 && (
                        <p className="text-[10px] text-white/30 mt-0.5">FWHM ước tính +{jetStream.fwhmBloatArcsec}&quot;</p>
                    )}
                </div>
            </div>

            {/* Atmospheric Dispersion Warning */}
            {refraction.dispersionWarning && (
                <div className="flex items-start gap-2 rounded-xl p-3"
                    style={{
                        background: refraction.dispersionLevel === "severe" ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.08)",
                        border: `1px solid ${refraction.dispersionLevel === "severe" ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.25)"}`,
                    }}>
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0"
                        style={{ color: refraction.dispersionLevel === "severe" ? "#f87171" : "#fbbf24" }} />
                    <div>
                        <p className="text-[9px] uppercase tracking-widest mb-0.5"
                            style={{ color: refraction.dispersionLevel === "severe" ? "rgba(248,113,113,0.6)" : "rgba(251,191,36,0.6)" }}>
                            ⚠️ Khúc xạ khí quyển — Saemundsson 1986
                        </p>
                        <p className="text-[11px] text-white/60">
                            Alt = {targetAlt.toFixed(1)}° → khúc xạ <b className="text-white">{refraction.refractionArcmin.toFixed(1)}&apos;</b>
                            {" "}— {refraction.dispersionLevel === "severe"
                                ? "Tán sắc màu nghiêm trọng (15–30\"), chụp ảnh không khả thi"
                                : "Tán sắc màu vừa phải (5–15\"), cần ADC corrector"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
