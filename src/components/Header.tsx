"use client";

import React, { useState } from "react";
import { MapPin, ChevronDown, Plus, Trash2, Waves } from "lucide-react";
import { useAppStore, DEFAULT_LOCATIONS, type LocationInfo } from "@/store/useAppStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsDialog } from "./SettingsDialog";
import { NotificationCenter } from "./NotificationCenter";

// Mini weather icon based on cloud cover from API (passed as prop from Dashboard)
function WeatherIcon({ cloudCover }: { cloudCover?: number }) {
    if (cloudCover === undefined) return <Waves className="h-3.5 w-3.5 opacity-30 animate-pulse" />;
    if (cloudCover > 70) return <span className="text-sm">⛅</span>;
    if (cloudCover > 30) return <span className="text-sm">🌤️</span>;
    return <span className="text-sm">✨</span>;
}

interface HeaderProps {
    currentCloudCover?: number;
}

export function Header({ currentCloudCover }: HeaderProps) {
    const { locations, activeLocationId, setActiveLocation, removeLocation, addLocation } = useAppStore();
    const activeLoc = locations.find(l => l.id === activeLocationId) || locations[0];

    const [locOpen, setLocOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customLat, setCustomLat] = useState("");
    const [customLon, setCustomLon] = useState("");

    const handleAddCustom = () => {
        if (!customName || !customLat || !customLon) return;
        const id = `custom-${Date.now()}`;
        const loc: LocationInfo = {
            id, name: customName, nameVi: customName,
            lat: parseFloat(customLat), lon: parseFloat(customLon),
            baseBortleSqm: 20.0, isCustom: true,
        };
        addLocation(loc);
        setActiveLocation(id);
        setCustomName(""); setCustomLat(""); setCustomLon("");
        setShowAddForm(false);
        setLocOpen(false);
    };

    const bortleLabel = (sqm: number) => {
        if (sqm >= 21.5) return "Bortle 2";
        if (sqm >= 21.0) return "Bortle 3";
        if (sqm >= 20.0) return "Bortle 4";
        if (sqm >= 19.0) return "Bortle 5";
        return "Bortle 6+";
    };

    return (
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/8">

            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                        <span className="text-lg">🔭</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#080614]" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">Interstellar</h1>
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em]">Mô hình Quang học Khí quyển</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">

                {/* Location Switcher */}
                <Popover open={locOpen} onOpenChange={setLocOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-sm text-white/70 max-w-[220px]"
                        >
                            <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                            <span className="truncate font-medium text-white/80">{activeLoc?.nameVi || activeLoc?.name}</span>
                            <WeatherIcon cloudCover={currentCloudCover} />
                            <ChevronDown className="h-3.5 w-3.5 text-white/30 shrink-0 ml-1" />
                        </button>
                    </PopoverTrigger>

                    <PopoverContent
                        className="w-72 p-2 border-white/15 shadow-2xl"
                        style={{ background: "#0c0a1a", borderRadius: 14 }}
                        align="end"
                    >
                        <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-0.5">
                            {/* Default locations */}
                            {DEFAULT_LOCATIONS.map(loc => (
                                <div
                                    key={loc.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{
                                        background: activeLocationId === loc.id ? "rgba(139,92,246,0.15)" : "transparent",
                                        border: activeLocationId === loc.id ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                                    }}
                                    onClick={() => { setActiveLocation(loc.id); setLocOpen(false); }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: activeLocationId === loc.id ? "#a78bfa" : "rgba(255,255,255,0.7)" }}>
                                            {loc.nameVi}
                                        </p>
                                        <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                                            {bortleLabel(loc.baseBortleSqm)} · {loc.elevation ? `${loc.elevation}m · ` : ""}{loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Custom locations */}
                            {locations.filter(l => l.isCustom).map(loc => (
                                <div
                                    key={loc.id}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                                    style={{ background: activeLocationId === loc.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                                    onClick={() => { setActiveLocation(loc.id); setLocOpen(false); }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white/70 truncate">{loc.nameVi} <span className="text-[9px] text-violet-400/50">(tuỳ chỉnh)</span></p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400"
                                        onClick={e => { e.stopPropagation(); removeLocation(loc.id); }}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}

                            {/* Divider + Add form */}
                            <div className="h-px bg-white/8 mx-2 my-1.5" />

                            {!showAddForm ? (
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-violet-400 hover:bg-violet-500/10 transition-colors"
                                    onClick={() => setShowAddForm(true)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Thêm vị trí tuỳ chỉnh
                                </button>
                            ) : (
                                <div className="px-2 py-2 space-y-2">
                                    <Input placeholder="Tên địa điểm" className="h-7 text-xs bg-white/5 border-white/10" value={customName} onChange={e => setCustomName(e.target.value)} />
                                    <div className="grid grid-cols-2 gap-1">
                                        <Input placeholder="Vĩ độ (lat)" type="number" className="h-7 text-xs bg-white/5 border-white/10" value={customLat} onChange={e => setCustomLat(e.target.value)} />
                                        <Input placeholder="Kinh độ (lon)" type="number" className="h-7 text-xs bg-white/5 border-white/10" value={customLon} onChange={e => setCustomLon(e.target.value)} />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" className="h-7 text-xs flex-1 bg-violet-600 hover:bg-violet-500" onClick={handleAddCustom}>Thêm</Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs text-white/40" onClick={() => setShowAddForm(false)}>Huỷ</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Notification Bell */}
                <NotificationCenter />

                {/* Settings */}
                <SettingsDialog />
            </div>
        </header>
    );
}
