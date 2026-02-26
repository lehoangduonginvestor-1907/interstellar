"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useAstroData } from "@/hooks/useAstroData";
import { useAppStore } from "@/store/useAppStore";
import { calculateTrueTransparency, calculateDynamicSQM, calculateAstroQualityScore } from "@/utils/skyOptics";
import { parseISO } from "date-fns";
import { Telescope, Clock, Star } from "lucide-react";

export function BestWindow() {
    const activeLocation = useAppStore(s => s.getActiveLocation());
    const { settings, addNotification, notifications } = useAppStore();
    const { meteo, sevenTimer, isLoading } = useAstroData(activeLocation);
    const [now, setNow] = useState(new Date());

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const bestWindow = useMemo(() => {
        if (!meteo.data || !sevenTimer.data || !activeLocation) return null;

        const mData = meteo.data.hourly;
        const sData = sevenTimer.data.dataseries;
        const hours = Math.min(72, mData.time.length);
        const mockMoonAlt = 20;
        const mockMoonIllum = 0.5;

        let bestScore = 0;
        let bestIdx = -1;
        let consecutive = 0;

        for (let i = 0; i < hours; i++) {
            const dateObj = parseISO(mData.time[i]);
            const hourOfDay = dateObj.getHours();
            if (hourOfDay >= 6 && hourOfDay <= 18) { consecutive = 0; continue; }

            const cloudCover = mData.cloud_cover[i];
            const { k, transparency } = calculateTrueTransparency(50, mData.relative_humidity_2m[i], 0.1);
            const sqm = calculateDynamicSQM(activeLocation.baseBortleSqm, mockMoonAlt, mockMoonIllum, k, 60);
            const sIdx = Math.min(Math.floor(i / 3), sData.length - 1);
            const seeingScore = Math.max(0, 100 - ((sData[sIdx].seeing - 1) * 14));
            const { score, isVetoed } = calculateAstroQualityScore({ cloudCover, sunAlt: -20, trueTransparency: transparency, dynamicSqm: sqm, seeingScore, deltaTempDewPt: mData.temperature_2m[i] - mData.dew_point_2m[i] });

            if (!isVetoed && score > 50) {
                consecutive++;
                if (score > bestScore && consecutive >= 2) {
                    bestScore = score;
                    bestIdx = i;
                }
            } else {
                consecutive = 0;
            }
        }

        if (bestIdx < 0) return null;

        const windowStart = parseISO(mData.time[bestIdx]);
        const windowEnd = new Date(windowStart.getTime() + 2 * 60 * 60 * 1000);
        return { start: windowStart, end: windowEnd, score: bestScore };

    }, [meteo.data, sevenTimer.data, activeLocation]);

    // Auto-add notification if above threshold
    useEffect(() => {
        if (!bestWindow || bestWindow.score < settings.alertThreshold) return;
        if (notifications.some(n => n.score === bestWindow.score && Date.now() - n.timestamp < 3600000)) return;
        addNotification({
            title: `Bầu trời đẹp lúc ${bestWindow.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}!`,
            message: `Điểm quan sát ${bestWindow.score}/100 tại ${activeLocation?.name}. Chuẩn bị máy ảnh đi!`,
            score: bestWindow.score,
            location: activeLocation?.name || "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bestWindow?.score]);

    // Countdown
    const countdown = useMemo(() => {
        if (!bestWindow) return null;
        const diff = bestWindow.start.getTime() - now.getTime();
        if (diff <= 0) return "Đang diễn ra!";
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }, [bestWindow, now]);

    if (isLoading) {
        return (
            <div className="w-full h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse flex items-center justify-center">
                <span className="text-white/20 text-xs">Đang phân tích khung giờ quan sát...</span>
            </div>
        );
    }

    if (!bestWindow) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 p-5 flex items-center gap-4"
                style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))" }}>
                <Telescope className="h-8 w-8 text-red-400/50 shrink-0" />
                <div>
                    <p className="text-sm font-bold text-white/60">Không có thời điểm quan sát tốt</p>
                    <p className="text-xs text-white/30 mt-0.5">72 giờ tới điều kiện không thuận lợi. Thử đổi địa điểm?</p>
                </div>
            </div>
        );
    }

    const scoreColor = bestWindow.score >= 80 ? "#34d399" : bestWindow.score >= 60 ? "#fbbf24" : "#f87171";

    return (
        <div className="relative overflow-hidden rounded-2xl border p-5 flex items-center gap-5"
            style={{ background: `linear-gradient(135deg, ${scoreColor}10, ${scoreColor}03, transparent)`, borderColor: `${scoreColor}30`, boxShadow: `0 0 40px -15px ${scoreColor}40` }}>

            {/* Glow blob */}
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${scoreColor}15, transparent 70%)` }} />

            {/* Score Badge */}
            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl shrink-0"
                style={{ background: `${scoreColor}15`, border: `2px solid ${scoreColor}30` }}>
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: scoreColor }}>{bestWindow.score}</span>
                <span className="text-[9px] font-bold uppercase" style={{ color: `${scoreColor}80` }}>SCORE</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                        {(() => {
                            // Dùng countdown để xác định có phải tối nay không
                            // nếu còn hơn 6 tiếng thì không thể là "tối nay"
                            const diffMs = bestWindow.start.getTime() - now.getTime();
                            const isTonight = diffMs >= 0 && diffMs <= 6 * 3600000;
                            const dateLabel = isTonight
                                ? "tối nay"
                                : bestWindow.start.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
                            return `Thời điểm quan sát tốt nhất ${dateLabel}`;
                        })()}
                    </p>
                </div>
                <p className="text-base font-extrabold text-white">
                    {bestWindow.start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {bestWindow.end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5">{activeLocation?.nameVi} · {activeLocation?.baseBortleSqm} mag/arcsec²</p>
            </div>

            {/* Countdown */}
            <div className="flex flex-col items-center shrink-0">
                <div className="flex items-center gap-1 text-white/30 mb-0.5">
                    <Clock className="h-3 w-3" />
                    <span className="text-[9px] uppercase tracking-widest">Còn</span>
                </div>
                <span className="text-lg font-mono font-extrabold tabular-nums" style={{ color: scoreColor }}>
                    {countdown}
                </span>
            </div>
        </div>
    );
}
