"use client";

import React, { useState, useEffect } from "react";
import { Telescope, Smartphone } from "lucide-react";
import { ScoreClock } from "./ScoreClock";
import { SqmBar } from "./SqmBar";
import { MilkyWayTracker } from "./MilkyWayTracker";
import { TargetTracker } from "./TargetTracker";
import { Header } from "./Header";
import { ForecastTimeline } from "./ForecastTimeline";
import { AstroCharts } from "./AstroCharts";
import { BestWindow } from "./BestWindow";
import { ExportButton } from "./ExportButton";
import {
    calculateTrueTransparency, calculateDynamicSQM, calculateAstroQualityScore
} from "@/utils/skyOptics";
import { useAstroData } from "@/hooks/useAstroData";
import { useAppStore } from "@/store/useAppStore";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import dynamic from "next/dynamic";

const SatelliteMap = dynamic(
    () => import("./SatelliteMap").then(mod => mod.SatelliteMap),
    { ssr: false, loading: () => <div className="w-full h-[380px] flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 animate-pulse"><span className="text-white/20 text-sm">Đang tải bản đồ vệ tinh...</span></div> }
);

export function Dashboard() {
    const [mounted, setMounted] = useState(false);
    const activeLocation = useAppStore(state => state.getActiveLocation());
    const activeTarget = useAppStore(state => state.activeTarget);
    const { canInstall, install } = usePWAInstall();

    const { meteo, sevenTimer, isLoading, isError } = useAstroData(activeLocation);

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    if (isError) {
        return (
            <div className="min-h-screen p-10 flex flex-col items-center justify-center gap-4">
                <Telescope className="h-12 w-12 text-red-400/40" />
                <h1 className="text-xl font-bold text-red-400">Lỗi kết nối API</h1>
                <p className="text-white/30 text-sm text-center max-w-xs">Không thể tải dữ liệu thời tiết từ Open-Meteo hoặc 7Timer. Vui lòng thử lại sau.</p>
            </div>
        );
    }

    // Physics for current hour
    let currentScore = 0, currentIsVetoed = false, currentVetoReason = "";
    let currentSqm = 0, currentTrueTransparency = 0, currentK = 0;
    let cloudCover = 0, temp = 0, dew = 0, seeing = 0;

    const mockMoonAlt = 24, mockMoonAz = 145, mockMoonIllum = 0.65;
    const targetAlt = 55, targetAz = 180;
    const altSagittariusA = 15;

    if (meteo.data && sevenTimer.data && activeLocation) {
        cloudCover = meteo.data.hourly.cloud_cover[0];
        temp = meteo.data.hourly.temperature_2m[0];
        dew = meteo.data.hourly.dew_point_2m[0];
        const sSeeing = sevenTimer.data.dataseries[0]?.seeing || 4;
        seeing = Math.max(0, 100 - ((sSeeing - 1) * 14));
        const optics = calculateTrueTransparency(50, meteo.data.hourly.relative_humidity_2m[0], 0.1);
        currentTrueTransparency = optics.transparency;
        currentK = optics.k;
        currentSqm = calculateDynamicSQM(activeLocation.baseBortleSqm, mockMoonAlt, mockMoonIllum, currentK, Math.abs(mockMoonAz - targetAz));
        const scoreResult = calculateAstroQualityScore({ cloudCover, sunAlt: -22, trueTransparency: currentTrueTransparency, dynamicSqm: currentSqm, seeingScore: seeing, deltaTempDewPt: temp - dew });
        currentScore = scoreResult.score;
        currentIsVetoed = scoreResult.isVetoed;
        currentVetoReason = scoreResult.vetoReason || "";
    }

    const zenithSqm = calculateDynamicSQM(activeLocation?.baseBortleSqm || 20, mockMoonAlt, mockMoonIllum, currentK, 90 - mockMoonAlt, 1.0);

    // Metric tile helper
    const MetricTile = ({ label, value, unit, desc, color }: { label: string; value: string; unit?: string; desc?: string; color: string }) => (
        <div className="relative overflow-hidden rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${color}12, ${color}05)`, border: `1px solid ${color}28` }}>
            <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}25, transparent 70%)`, transform: "translate(25%,-25%)" }} />
            <p className="text-[9px] uppercase font-bold tracking-widest mb-1" style={{ color: `${color}90` }}>{label}</p>
            <p className="text-2xl font-extrabold text-white tabular-nums">{value}<span className="text-sm ml-0.5 font-normal" style={{ color: `${color}70` }}>{unit}</span></p>
            {desc && <p className="text-[10px] mt-1 text-white/25">{desc}</p>}
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}45, transparent)` }} />
        </div>
    );

    const ccColor = cloudCover > 70 ? "#f87171" : cloudCover > 40 ? "#fbbf24" : "#34d399";
    const svColor = seeing >= 70 ? "#34d399" : seeing >= 40 ? "#fbbf24" : "#f87171";
    const dtVal = temp - dew;
    const dtColor = dtVal <= 1 ? "#f87171" : dtVal >= 5 ? "#34d399" : "#fbbf24";

    return (
        <div className="min-h-screen bg-transparent text-foreground font-sans selection:bg-violet-500/30">
            <div id="dashboard-main" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 space-y-8 pb-24">

                <Header currentCloudCover={isLoading ? undefined : cloudCover} />

                {/* Best Window Hero */}
                <section>
                    <BestWindow />
                </section>

                {/* TOP ROW: Score gauge + metrics */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* Gauge */}
                    <div className="col-span-1 md:col-span-4 flex justify-center py-10 rounded-3xl relative overflow-hidden"
                        style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                            border: "1px solid rgba(255,255,255,0.1)",
                            boxShadow: currentIsVetoed ? "0 0 60px -20px rgba(239,68,68,0.35)" : "0 0 60px -20px rgba(139,92,246,0.3)",
                        }}>
                        <div className="absolute inset-0 pointer-events-none" style={{ background: currentIsVetoed ? "radial-gradient(ellipse at center, rgba(239,68,68,0.05), transparent 70%)" : "radial-gradient(ellipse at center, rgba(139,92,246,0.07), transparent 70%)" }} />
                        {isLoading ? (
                            <div className="w-[200px] h-[200px] rounded-full" style={{ border: "8px solid rgba(255,255,255,0.05)", borderTopColor: "#8b5cf6", animation: "spin 1s linear infinite" }} />
                        ) : (
                            <ScoreClock score={currentScore} isVetoed={currentIsVetoed} vetoReason={currentVetoReason} size={220} />
                        )}
                    </div>

                    {/* Right side */}
                    <div className="col-span-1 md:col-span-8 space-y-5">
                        <div className={isLoading ? "opacity-30 blur-sm pointer-events-none" : ""}>
                            <SqmBar sqm={isLoading ? 20 : currentSqm} />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <MetricTile label="Độ trong suốt" value={isLoading ? "—" : currentTrueTransparency.toFixed(1)} unit="%" desc={`k = ${isLoading ? "—" : currentK.toFixed(3)}`} color="#34d399" />
                            <MetricTile label="Độ che phủ mây" value={isLoading ? "—" : cloudCover.toString()} unit="%" desc={cloudCover > 70 ? "Ngưỡng chặn" : cloudCover > 40 ? "Gần nửa bầu trời" : "Trời quang"} color={ccColor} />
                            <MetricTile label="Độ ổn định KQ" value={isLoading ? "—" : seeing.toString()} unit="/100" desc={seeing >= 70 ? "Tuyệt vời" : seeing >= 40 ? "Trung bình" : "Kém"} color={svColor} />
                            <MetricTile label="Rủi ro sương (ΔT)" value={isLoading ? "—" : dtVal.toFixed(1)} unit="°C" desc={dtVal <= 1 ? "Nguy cơ cao!" : dtVal >= 5 ? "An toàn" : "Trung bình"} color={dtColor} />
                        </div>
                    </div>
                </section>

                {/* Forecast Timeline + 7-day */}
                <section>
                    <ForecastTimeline />
                </section>

                {/* Charts */}
                <section>
                    <AstroCharts />
                </section>

                {/* Satellite Map */}
                <section>
                    <SatelliteMap />
                </section>

                {/* Trackers */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MilkyWayTracker altSagittariusA={altSagittariusA} dynamicSqmZenith={isLoading ? 20 : zenithSqm} />
                    <TargetTracker
                        targetName={activeTarget?.name || "Mục tiêu"}
                        targetAlt={targetAlt}
                        targetAz={targetAz}
                        moonAlt={mockMoonAlt}
                        moonAz={mockMoonAz}
                        windSpeed500hPa={isLoading ? 0 : (meteo.data?.hourly.wind_speed_500hPa?.[0] ?? 0)}
                        tempCelsius={isLoading ? 25 : temp}
                    />
                </section>

                {/* Footer bar: Export + PWA Install */}
                <section className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/8">
                    <div className="flex items-center gap-2 text-white/20">
                        <Telescope className="h-4 w-4" />
                        <span className="text-xs">Interstellar v2 · Dữ liệu: Open-Meteo, 7Timer · Lý thuyết: Beer-Lambert, Krisciunas-Schaefer</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {canInstall && (
                            <button onClick={install} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-violet-200 transition-all"
                                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.1))", border: "1px solid rgba(139,92,246,0.35)", boxShadow: "0 0 15px -5px rgba(139,92,246,0.4)" }}>
                                <Smartphone className="h-3.5 w-3.5" />
                                Cài Interstellar như App ✨
                            </button>
                        )}
                        <ExportButton targetId="dashboard-main" />
                    </div>
                </section>
            </div>
        </div>
    );
}
