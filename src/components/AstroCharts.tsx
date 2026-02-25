"use client";

import React, { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, ComposedChart, Line
} from "recharts";
import { useAstroData } from "@/hooks/useAstroData";
import { useAppStore } from "@/store/useAppStore";
import { calculateDynamicSQM, calculateTrueTransparency } from "@/utils/skyOptics";

// Vivid explicit colors (no CSS vars in SVG – they don't resolve correctly)
const COLORS = {
    highCloud: "#64748b", // slate-500
    midCloud: "#818cf8", // indigo-400
    lowCloud: "#f472b6", // pink-400
    transparency: "#34d399", // emerald-400
    sqm: "#fbbf24", // amber-400
    grid: "rgba(255,255,255,0.07)",
    axis: "rgba(255,255,255,0.35)",
    tooltipBg: "#0f0f1a",
    tooltipBorder: "rgba(255,255,255,0.12)",
};

interface TooltipEntry { name: string; value: number | string; color: string; payload: { fullLabel: string } }
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string | number }) => {
    if (!active || !payload?.length) return null;
    const displayLabel = payload[0]?.payload?.fullLabel ?? label;
    return (
        <div style={{ background: COLORS.tooltipBg, border: `1px solid ${COLORS.tooltipBorder}`, borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600 }}>{displayLabel}</p>
            {payload.map((entry, i: number) => (
                <p key={i} style={{ color: entry.color, margin: "2px 0" }}>
                    <span style={{ opacity: 0.7 }}>{entry.name}: </span>
                    <span style={{ fontWeight: 700 }}>{typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}</span>
                    {entry.name === "SQM" ? " mag/arcsec²" : "%"}
                </p>
            ))}
        </div>
    );
};

export function AstroCharts() {
    const activeLocation = useAppStore(state => state.getActiveLocation());
    const { meteo, sevenTimer, isLoading } = useAstroData(activeLocation);

    const chartData = useMemo(() => {
        if (!meteo.data || !sevenTimer.data || !activeLocation) return [];

        const mData = meteo.data.hourly;
        const hours = Math.min(48, mData.time.length);
        const result = [];

        const mockMoonAlt = 20;
        const mockMoonIllum = 0.5;

        for (let i = 0; i < hours; i++) {
            const timeStr = mData.time[i];
            const dateObj = parseISO(timeStr);

            const low = mData.cloud_cover_low[i];
            const mid = mData.cloud_cover_mid[i];
            const high = mData.cloud_cover_high[i];

            const { k, transparency } = calculateTrueTransparency(50, mData.relative_humidity_2m[i], 0.1);
            const sqm = calculateDynamicSQM(activeLocation.baseBortleSqm, mockMoonAlt, mockMoonIllum, k, 60);

            result.push({
                idx: i,                                    // unique numeric key
                time: format(dateObj, "HH:mm"),            // display label
                fullLabel: format(dateObj, "dd/MM HH:mm"), // tooltip label
                day: format(dateObj, "dd/MM"),
                lowCloud: low,
                midCloud: mid,
                highCloud: high,
                transparency: parseFloat(transparency.toFixed(1)),
                sqm: parseFloat(sqm.toFixed(2)),
            });
        }

        return result;
    }, [meteo.data, sevenTimer.data, activeLocation]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-64 w-full rounded-2xl border border-white/10 bg-white/5 animate-pulse flex items-center justify-center">
                        <span className="text-white/20 text-sm tracking-widest uppercase">Loading...</span>
                    </div>
                ))}
            </div>
        );
    }

    if (chartData.length === 0) return null;

    return (
        <div className="space-y-6">

            {/* --- Cloud Layers Chart --- */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(129,140,248,0.08),_transparent_60%)] pointer-events-none" />
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-base font-bold tracking-tight text-white">Cloud Layers & True Transparency</h3>
                        <p className="text-xs text-white/40 mt-0.5">Stacked model: Low / Mid / High altitude cloud interference</p>
                    </div>
                    <div className="flex gap-3 text-[11px] flex-wrap justify-end">
                        {[
                            { color: COLORS.lowCloud, label: "Low" },
                            { color: COLORS.midCloud, label: "Mid" },
                            { color: COLORS.highCloud, label: "High" },
                            { color: COLORS.transparency, label: "Transparency" },
                        ].map(({ color, label }) => (
                            <span key={label} className="flex items-center gap-1.5 text-white/50">
                                <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.lowCloud} stopOpacity={0.7} />
                                    <stop offset="100%" stopColor={COLORS.lowCloud} stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="gradMid" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.midCloud} stopOpacity={0.6} />
                                    <stop offset="100%" stopColor={COLORS.midCloud} stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.highCloud} stopOpacity={0.4} />
                                    <stop offset="100%" stopColor={COLORS.highCloud} stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="gradTrans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.transparency} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={COLORS.transparency} stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 6" vertical={false} stroke={COLORS.grid} />
                            <XAxis
                                dataKey="idx"
                                stroke={COLORS.axis}
                                tick={{ fill: COLORS.axis, fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={24}
                                tickFormatter={(v: number) => {
                                    const d = chartData[v];
                                    return d ? d.time : "";
                                }}
                            />
                            <YAxis
                                stroke={COLORS.axis}
                                tick={{ fill: COLORS.axis, fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={v => `${v}%`}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="highCloud" name="High Clouds" stackId="clouds" stroke={COLORS.highCloud} fill="url(#gradHigh)" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="midCloud" name="Mid Clouds" stackId="clouds" stroke={COLORS.midCloud} fill="url(#gradMid)" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="lowCloud" name="Low Clouds" stackId="clouds" stroke={COLORS.lowCloud} fill="url(#gradLow)" strokeWidth={1.5} />
                            <Line type="monotone" dataKey="transparency" name="True Trans." stroke={COLORS.transparency} strokeWidth={2.5} dot={false} strokeDasharray="6 3" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- SQM Chart --- */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(251,191,36,0.06),_transparent_60%)] pointer-events-none" />
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-base font-bold tracking-tight text-white">Dynamic Sky Quality Meter</h3>
                        <p className="text-xs text-white/40 mt-0.5">Adjusted for lunar proximity, airmass, and atmospheric scattering</p>
                    </div>
                    <div className="text-[11px] text-white/40 border border-white/10 rounded-lg px-3 py-1.5">
                        mag/arcsec²
                    </div>
                </div>
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradSqm" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={COLORS.sqm} stopOpacity={0.5} />
                                    <stop offset="100%" stopColor={COLORS.sqm} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 6" vertical={false} stroke={COLORS.grid} />
                            <XAxis
                                dataKey="idx"
                                stroke={COLORS.axis}
                                tick={{ fill: COLORS.axis, fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={24}
                                tickFormatter={(v: number) => {
                                    const d = chartData[v];
                                    return d ? d.time : "";
                                }}
                            />
                            <YAxis
                                domain={[10, 22]}
                                stroke={COLORS.axis}
                                tick={{ fill: COLORS.axis, fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                ticks={[10, 13, 16, 19, 22]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
                            {/* Reference lines for Bortle classes */}
                            <ReferenceLine y={21.5} stroke="rgba(52,211,153,0.3)" strokeDasharray="4 4" label={{ value: "Bortle 3", fill: "rgba(52,211,153,0.5)", fontSize: 9, position: "insideTopRight" }} />
                            <ReferenceLine y={19.5} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" label={{ value: "Bortle 5", fill: "rgba(251,191,36,0.5)", fontSize: 9, position: "insideTopRight" }} />
                            <Area type="stepAfter" dataKey="sqm" name="SQM" stroke={COLORS.sqm} strokeWidth={2.5} fill="url(#gradSqm)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
