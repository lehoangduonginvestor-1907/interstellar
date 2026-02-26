"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/store/useAppStore";
import L from "leaflet";
import { Map, Satellite, Play, Pause, ChevronLeft, ChevronRight, Clock } from "lucide-react";

// Fix standard Leaflet Marker Icons in Next.js
const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

function MapUpdater({ lat, lon }: { lat: number, lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], 6);
    }, [lat, lon, map]);
    return null;
}

// Total steps: 24h × 6 steps/hr = 144 steps of 10 min each
// sliderVal = 0 means "most recent", 143 means "24h ago"
const TOTAL_STEPS = 144;

function buildHimawariUrl(stepsBack: number): { url: string; localLabel: string } {
    const now = new Date();
    // snap to nearest 10-min mark, subtract stepsBack × 10 min, add 1h buffer for data latency
    const baseMs = Math.floor(now.getTime() / 600_000) * 600_000 - (stepsBack + 6) * 600_000;
    const d = new Date(baseMs);
    const Y = d.getUTCFullYear();
    const M = String(d.getUTCMonth() + 1).padStart(2, "0");
    const D = String(d.getUTCDate()).padStart(2, "0");
    const H = String(d.getUTCHours()).padStart(2, "0");
    const Min = String(d.getUTCMinutes()).padStart(2, "0");
    const url = `https://himawari8.nict.go.jp/img/D531106/1d/550/${Y}/${M}/${D}/${H}${Min}00_0_0.png`;

    // Convert UTC to local UTC+7 for display label
    const localMs = baseMs + 7 * 3600_000;
    const ld = new Date(localMs);
    const lH = String(ld.getUTCHours()).padStart(2, "0");
    const lMin = String(ld.getUTCMinutes()).padStart(2, "0");
    const lD = String(ld.getUTCDate()).padStart(2, "0");
    const lMo = String(ld.getUTCMonth() + 1).padStart(2, "0");
    const localLabel = `${lD}/${lMo} ${lH}:${lMin} (UTC+7)`;

    return { url, localLabel };
}

function HimawariPanel() {
    // 0 = most recent available, TOTAL_STEPS-1 = 24h ago
    const [sliderVal, setSliderVal] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [imgStatus, setImgStatus] = useState<"loading" | "ok" | "error">("loading");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { url, localLabel } = useMemo(() => buildHimawariUrl(sliderVal), [sliderVal]);

    // Playback: step forward every 350ms
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setSliderVal(v => {
                    if (v <= 0) { setIsPlaying(false); return 0; }
                    return v - 1;
                });
            }, 350);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying]);

    // Reset loading state when URL changes
    useEffect(() => { setImgStatus("loading"); }, [url]);

    const hoursAgo = ((sliderVal + 6) * 10 / 60).toFixed(1);

    return (
        <div className="flex flex-col gap-4">
            {/* Timestamp bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-cyan-400/70" />
                    <span className="text-xs font-mono font-bold text-cyan-300">{localLabel}</span>
                    {sliderVal > 0 && (
                        <span className="text-[10px] text-white/30">({hoursAgo}h trước)</span>
                    )}
                    {sliderVal === 0 && (
                        <span className="text-[10px] text-emerald-400/70 font-semibold">Mới nhất</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-white/20">Himawari-9 · IR B13</span>
                </div>
            </div>

            {/* Satellite image */}
            <div
                className="relative w-full rounded-xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{
                    background: "radial-gradient(ellipse at center, #0c1a2e, #050a14)",
                    minHeight: 340,
                }}
            >
                {imgStatus === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                        <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
                            style={{ animation: "spin 0.9s linear infinite" }} />
                        <span className="text-xs text-white/30">Đang tải ảnh vệ tinh...</span>
                    </div>
                )}
                {imgStatus === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <Satellite className="h-8 w-8 text-white/15" />
                        <span className="text-xs text-white/30">Chưa có dữ liệu cho khung giờ này</span>
                    </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={url}
                    src={url}
                    alt={`Himawari-9 IR ${localLabel}`}
                    onLoad={() => setImgStatus("ok")}
                    onError={() => setImgStatus("error")}
                    className="w-full object-contain transition-opacity duration-300"
                    style={{
                        opacity: imgStatus === "ok" ? 1 : 0,
                        maxHeight: 480,
                        filter: "saturate(1.1) brightness(1.05)",
                    }}
                />
                {/* Location label overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/70">Asia-Pacific · Full Disk</span>
                </div>
            </div>

            {/* Slider */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    {/* Playback controls */}
                    <button
                        onClick={() => setSliderVal(v => Math.min(TOTAL_STEPS - 1, v + 1))}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Khung trước"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => setIsPlaying(p => !p)}
                        className="p-1.5 rounded-lg font-bold transition-all"
                        style={{
                            background: isPlaying ? "rgba(236,72,153,0.15)" : "rgba(6,182,212,0.15)",
                            border: isPlaying ? "1px solid rgba(236,72,153,0.3)" : "1px solid rgba(6,182,212,0.3)",
                            color: isPlaying ? "#f472b6" : "#22d3ee",
                        }}
                        title={isPlaying ? "Dừng" : "Phát"}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>

                    <button
                        onClick={() => setSliderVal(v => Math.max(0, v - 1))}
                        className="p-1.5 rounded-lg text-white/50 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Khung sau"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Time slider */}
                    <div className="flex-1 flex flex-col gap-1">
                        <input
                            type="range"
                            min={0}
                            max={TOTAL_STEPS - 1}
                            // slider left = oldest, right = newest
                            value={TOTAL_STEPS - 1 - sliderVal}
                            onChange={e => setSliderVal(TOTAL_STEPS - 1 - Number(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer"
                            style={{ accentColor: "#22d3ee" }}
                        />
                        <div className="flex justify-between text-[9px] text-white/25 px-0.5">
                            <span>−24h</span>
                            <span>−12h</span>
                            <span>Hiện tại</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info tip */}
            <p className="text-[10px] text-white/25 leading-relaxed">
                💡 Xem chuyển động mây trong 24h qua để dự đoán xu hướng bầu trời vài tiếng tới. Nguồn: NICT / JMA Himawari-9.
            </p>
        </div>
    );
}

export function SatelliteMap() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"map" | "himawari">("map");
    const activeLocation = useAppStore(state => state.getActiveLocation());

    useEffect(() => { setMounted(true); }, []);

    if (!mounted || !activeLocation) return (
        <div className="w-full h-[400px] flex items-center justify-center bg-card/10 rounded-2xl border border-white/10 animate-pulse">
            <span className="text-muted-foreground text-sm font-medium">Đang tải bản đồ vệ tinh...</span>
        </div>
    );

    return (
        <div className="bg-card/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 w-full flex flex-col gap-5">

            {/* Header + Tab switcher */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Bản đồ vệ tinh</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {activeTab === "map"
                            ? "Lớp mây thời gian thực theo vị trí quan sát"
                            : "Ảnh hồng ngoại Himawari-9 · Chọn thời gian để xem xu hướng mây"}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button
                        onClick={() => setActiveTab("map")}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all"
                        style={activeTab === "map" ? {
                            background: "rgba(139,92,246,0.2)",
                            color: "#a78bfa",
                            borderRight: "1px solid rgba(255,255,255,0.06)"
                        } : {
                            color: "rgba(255,255,255,0.35)",
                            borderRight: "1px solid rgba(255,255,255,0.06)"
                        }}
                    >
                        <Map className="h-3.5 w-3.5" />
                        Bản đồ mây
                    </button>
                    <button
                        onClick={() => setActiveTab("himawari")}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold transition-all"
                        style={activeTab === "himawari" ? {
                            background: "rgba(6,182,212,0.15)",
                            color: "#22d3ee",
                        } : {
                            color: "rgba(255,255,255,0.35)",
                        }}
                    >
                        <Satellite className="h-3.5 w-3.5" />
                        Himawari-9 IR
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === "map" ? (
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-white/10 relative z-10">
                    <MapContainer
                        center={[activeLocation.lat, activeLocation.lon]}
                        zoom={6}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%", backgroundColor: "#0a0114" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <TileLayer
                            attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
                            url="https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2"
                            opacity={0.6}
                        />
                        <Marker position={[activeLocation.lat, activeLocation.lon]} icon={customIcon}>
                            <Popup className="text-black font-semibold">
                                {activeLocation.name} <br />
                                Lat: {activeLocation.lat}, Lon: {activeLocation.lon}
                            </Popup>
                        </Marker>
                        <MapUpdater lat={activeLocation.lat} lon={activeLocation.lon} />
                    </MapContainer>
                </div>
            ) : (
                <HimawariPanel />
            )}
        </div>
    );
}
