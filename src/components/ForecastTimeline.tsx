"use client";

import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useAstroData } from "@/hooks/useAstroData";
import { useAppStore } from "@/store/useAppStore";
import { calculateTrueTransparency, calculateDynamicSQM, calculateAstroQualityScore, calculateForecastUncertainty } from "@/utils/skyOptics";
import { AlertTriangle } from "lucide-react";

// --- 7 Day daily summary cards ---
function DayCard({ date, score, cloudCover, peak }: { date: Date; score: number; cloudCover: number; peak: boolean }) {
    const scoreColor = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : score > 0 ? "#f87171" : "rgba(255,255,255,0.15)";
    const icon = cloudCover > 70 ? "☁️" : cloudCover > 40 ? "⛅" : score > 50 ? "✨" : "🌑";

    return (
        <div
            className="flex-1 min-w-[72px] flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
            style={{ background: peak ? `${scoreColor}12` : "rgba(255,255,255,0.03)", border: `1px solid ${peak ? scoreColor + "30" : "rgba(255,255,255,0.06)"}` }}
        >
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{format(date, "EEE")}</p>
            <p className="text-[10px] text-white/25">{format(date, "dd/MM")}</p>
            <span className="text-xl">{icon}</span>
            <div className="flex flex-col items-center">
                <span className="text-sm font-extrabold tabular-nums" style={{ color: scoreColor }}>{score || "—"}</span>
                <span className="text-[9px] text-white/25">{cloudCover}%☁</span>
            </div>
        </div>
    );
}

export function ForecastTimeline() {
    const activeLocation = useAppStore(state => state.getActiveLocation());
    const { meteo, sevenTimer, isLoading } = useAstroData(activeLocation);

    const { timeline, weekSummary, uncertainty } = useMemo(() => {
        if (!meteo.data || !sevenTimer.data || !activeLocation) return { timeline: [], weekSummary: [], uncertainty: 0 };

        const mData = meteo.data.hourly;
        const sData = sevenTimer.data.dataseries;
        const hours = Math.min(72, mData.time.length);
        const mockMoonAlt = 20;
        const mockMoonIllum = 0.5;
        const result = [];
        const allScores: number[] = [];

        for (let i = 0; i < hours; i++) {
            const dateObj = parseISO(mData.time[i]);
            const sIdx = Math.min(Math.floor(i / 3), sData.length - 1);
            const cloudCover = mData.cloud_cover[i];
            const { k, transparency } = calculateTrueTransparency(50, mData.relative_humidity_2m[i], 0.1);
            const sqm = calculateDynamicSQM(activeLocation.baseBortleSqm, mockMoonAlt, mockMoonIllum, k, 60);
            const seeingScore = Math.max(0, 100 - ((sData[sIdx].seeing - 1) * 14));
            const { score, isVetoed } = calculateAstroQualityScore({ cloudCover, sunAlt: -20, trueTransparency: transparency, dynamicSqm: sqm, seeingScore, deltaTempDewPt: mData.temperature_2m[i] - mData.dew_point_2m[i] });
            const hourOfDay = dateObj.getHours();
            const isDaytime = hourOfDay >= 6 && hourOfDay <= 18;
            if (!isDaytime && !isVetoed) allScores.push(score);
            result.push({ time: dateObj, hourOfDay, score: isDaytime ? 0 : score, isVetoed: isDaytime ? true : isVetoed, isDaytime, cloudCover, sqm });
        }

        // 7-day daily best
        const dailyMap = new Map<string, { scores: number[], cloud: number[] }>();
        for (let i = 0; i < Math.min(168, mData.time.length); i++) {
            const d = parseISO(mData.time[i]);
            const key = format(d, "yyyy-MM-dd");
            if (!dailyMap.has(key)) dailyMap.set(key, { scores: [], cloud: [] });
            dailyMap.get(key)!.cloud.push(mData.cloud_cover[i]);
            const { k, transparency } = calculateTrueTransparency(50, mData.relative_humidity_2m[i], 0.1);
            const sqm = calculateDynamicSQM(activeLocation.baseBortleSqm, mockMoonAlt, mockMoonIllum, k, 60);
            const sIdx = Math.min(Math.floor(i / 3), sData.length - 1);
            const { score } = calculateAstroQualityScore({ cloudCover: mData.cloud_cover[i], sunAlt: d.getHours() < 6 || d.getHours() > 18 ? -20 : 0, trueTransparency: transparency, dynamicSqm: sqm, seeingScore: Math.max(0, 100 - ((sData[sIdx].seeing - 1) * 14)), deltaTempDewPt: mData.temperature_2m[i] - mData.dew_point_2m[i] });
            dailyMap.get(key)!.scores.push(score);
        }
        const weekOut = Array.from(dailyMap.entries()).slice(0, 7).map(([dateStr, { scores, cloud }]) => ({
            date: new Date(dateStr),
            score: Math.round(Math.max(...scores.filter(s => s > 0), 0)),
            cloudCover: Math.round(cloud.reduce((a, b) => a + b) / cloud.length),
        }));
        const peakScore = Math.max(...weekOut.map(d => d.score));

        const sigma = calculateForecastUncertainty(allScores);
        const sigmaPercent = allScores.length > 0 ? (sigma / (allScores.reduce((a, b) => a + b) / allScores.length)) * 100 : 0;

        return { timeline: result, weekSummary: weekOut, uncertainty: sigmaPercent };
    }, [meteo.data, sevenTimer.data, activeLocation]);

    const getDayLabel = (d: Date) => format(d, "EEE dd/MM");

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="w-full h-36 rounded-2xl border border-white/10 bg-white/5 animate-pulse flex items-center justify-center">
                    <span className="text-white/20 text-sm tracking-widest uppercase">Đang tải dự báo...</span>
                </div>
            </div>
        );
    }
    if (timeline.length === 0) return null;

    const peakScore = weekSummary.length > 0 ? Math.max(...weekSummary.map(d => d.score)) : 0;

    return (
        <div className="space-y-4">

            {/* 72h hourly timeline */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04), transparent)" }}>
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-white">72-Giờ Dự báo Quan sát</h3>
                        <p className="text-[10px] text-white/30 mt-0.5">Xanh ≥80 · Vàng ≥60 · Đỏ &lt;60 · Xám = Chặn/Ban ngày</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {uncertainty > 25 && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
                                <AlertTriangle className="h-3 w-3" />
                                ⚠️ Độ tin cậy thấp (σ={uncertainty.toFixed(0)}%)
                            </span>
                        )}
                        <span className="text-[10px] text-white/20 border border-white/8 rounded-lg px-2.5 py-1 uppercase tracking-widest">Open-Meteo · 7Timer</span>
                    </div>
                </div>

                <div className="flex overflow-x-auto pb-3 gap-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
                    {timeline.map((point, idx) => {
                        let bg = "rgba(255,255,255,0.03)";
                        let textColor = "rgba(255,255,255,0.15)";
                        let barColor = "rgba(255,255,255,0.05)";
                        let label = "";

                        if (point.isDaytime) { bg = "rgba(251,146,60,0.06)"; textColor = "rgba(251,146,60,0.35)"; label = "☀"; barColor = "rgba(251,146,60,0.15)"; }
                        else if (point.isVetoed) { bg = "rgba(239,68,68,0.07)"; textColor = "rgba(239,68,68,0.4)"; label = "✕"; barColor = "rgba(239,68,68,0.2)"; }
                        else if (point.score >= 80) { bg = "rgba(52,211,153,0.1)"; textColor = "#34d399"; barColor = "#34d399"; }
                        else if (point.score >= 60) { bg = "rgba(251,191,36,0.09)"; textColor = "#fbbf24"; barColor = "#fbbf24"; }
                        else { bg = "rgba(248,113,113,0.07)"; textColor = "rgba(248,113,113,0.55)"; barColor = "rgba(248,113,113,0.4)"; }

                        const isNewDay = idx === 0 || getDayLabel(point.time) !== getDayLabel(timeline[idx - 1].time);
                        const barHeight = point.isDaytime || point.isVetoed ? 12 : Math.max(4, (point.score / 100) * 50);

                        return (
                            <React.Fragment key={idx}>
                                {isNewDay && (
                                    <div className="flex flex-col items-center justify-end min-w-[36px] pb-1 self-stretch">
                                        <span className="text-[8px] font-bold text-white/20 whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                                            {format(point.time, "EEE dd")}
                                        </span>
                                        <div className="w-px flex-1 bg-white/8 mt-1" />
                                    </div>
                                )}
                                <div className="snap-center flex flex-col items-center justify-end min-w-[40px] h-28 rounded-lg px-1 py-2 group relative transition-all duration-150 hover:scale-105 cursor-default"
                                    style={{ backgroundColor: bg }}>
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        {label ? <span className="text-sm" style={{ color: textColor }}>{label}</span>
                                            : <span className="text-base font-extrabold tabular-nums" style={{ color: textColor }}>{point.score}</span>}
                                    </div>
                                    <div className="w-full h-12 flex items-end justify-center">
                                        <div className="w-3.5 rounded-t-sm" style={{ height: barHeight, backgroundColor: barColor, opacity: 0.8 }} />
                                    </div>
                                    <span className="text-[9px] font-medium mt-1" style={{ color: textColor }}>{format(point.time, "HH:mm")}</span>

                                    {!point.isDaytime && !point.isVetoed && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block bg-[#0f0f1a] border border-white/10 rounded-lg p-2.5 text-[10px] whitespace-nowrap shadow-xl">
                                            <p className="text-white/50">Điểm: <b className="text-white">{point.score}</b></p>
                                            <p className="text-white/50">Mây: <b className="text-white">{point.cloudCover}%</b></p>
                                            <p className="text-white/50">SQM: <b className="text-white">{point.sqm.toFixed(1)}</b></p>
                                        </div>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* 7-day daily summary */}
            {weekSummary.length > 0 && (
                <div className="rounded-2xl border border-white/8 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">Dự báo 7 ngày</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {weekSummary.map((day, i) => (
                            <DayCard key={i} date={day.date} score={day.score} cloudCover={day.cloudCover} peak={day.score === peakScore && peakScore > 50} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
