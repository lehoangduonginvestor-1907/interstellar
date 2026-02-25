"use client";

import React, { useState } from "react";
import { useAppStore, DSO_PRESETS, type DSOTarget, type Settings } from "@/store/useAppStore";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type TabId = "weights" | "targets" | "api" | "other";

export function SettingsDialog() {
    const { settings, updateSettings, activeTarget, setActiveTarget } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("weights");
    const [local, setLocal] = useState<Settings>(settings);
    const [localTarget, setLocalTarget] = useState<DSOTarget>(activeTarget);
    const [saving, setSaving] = useState(false);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setLocal(settings);
            setLocalTarget(activeTarget);
        }
        setIsOpen(open);
    };

    const handleSave = () => {
        setSaving(true);
        updateSettings(local);
        setActiveTarget(localTarget);
        setTimeout(() => {
            setSaving(false);
            setIsOpen(false);
            toast.success("Đã lưu cài đặt!", {
                description: "Tất cả thay đổi đã được áp dụng.",
                duration: 3000,
            });
        }, 400);
    };

    const totalWeight = Object.values(local.weights).reduce((a, b) => a + b, 0);

    const tabs: { id: TabId; label: string }[] = [
        { id: "weights", label: "Trọng số" },
        { id: "targets", label: "Mục tiêu DSO" },
        { id: "api", label: "API Keys" },
        { id: "other", label: "Khác" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 border border-white/10 hover:border-white/20 hover:bg-white/5">
                    <SettingsIcon className="h-4 w-4 text-white/50" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden"
                style={{ background: '#0c0a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }}>

                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-violet-400" />
                        Cài đặt Hệ thống
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-4 border-b border-white/10 pb-0">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className="text-xs px-3 py-2 rounded-t-lg font-semibold transition-colors"
                            style={{
                                color: activeTab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                                borderBottom: activeTab === t.id ? '2px solid #8b5cf6' : '2px solid transparent',
                                background: activeTab === t.id ? 'rgba(139,92,246,0.08)' : 'transparent',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="px-6 py-5 max-h-[55vh] overflow-y-auto space-y-5 text-sm">

                    {/* ---- TAB: WEIGHTS ---- */}
                    {activeTab === "weights" && (
                        <div className="space-y-5">
                            <div className="flex justify-between items-center">
                                <p className="text-white/50 text-xs">Tổng trọng số: <span className={totalWeight !== 100 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{totalWeight}%</span></p>
                                {totalWeight !== 100 && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Nên bằng 100%</span>}
                            </div>
                            {(Object.keys(local.weights) as (keyof Settings["weights"])[]).map((key) => {
                                const labels: Record<string, string> = { cloud: "Mây (Cloud Cover)", transparency: "Độ trong suốt", sqm: "Độ tối bầu trời (SQM)", seeing: "Độ ổn định khí quyển", dewPoint: "Rủi ro sương đọng (ΔT)" };
                                return (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label className="text-white/70 text-xs">{labels[key]}</Label>
                                            <span className="text-violet-300 font-bold text-xs tabular-nums">{local.weights[key]}%</span>
                                        </div>
                                        <Slider
                                            value={[local.weights[key]]}
                                            min={0} max={60} step={1}
                                            className="[&>span]:bg-violet-500"
                                            onValueChange={([v]) => setLocal(s => ({ ...s, weights: { ...s.weights, [key]: v } }))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ---- TAB: DSO TARGETS ---- */}
                    {activeTab === "targets" && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-white/50 text-xs mb-2 block">Chọn mục tiêu DSO</Label>
                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                    {DSO_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setLocalTarget(preset)}
                                            className="w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs"
                                            style={{
                                                background: localTarget.name === preset.name ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                                border: localTarget.name === preset.name ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                                color: localTarget.name === preset.name ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                                            }}
                                        >
                                            <span className="font-semibold">{preset.name}</span>
                                            <span className="text-white/25 ml-2">RA {preset.ra.toFixed(1)}° Dec {preset.dec.toFixed(1)}°</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-3">
                                <Label className="text-white/50 text-xs">Mục tiêu thủ công</Label>
                                <Input placeholder="Tên mục tiêu" className="h-8 text-xs bg-white/5 border-white/10"
                                    value={localTarget.name.startsWith("M") || DSO_PRESETS.some(p => p.name === localTarget.name) ? "" : localTarget.name}
                                    onChange={e => setLocalTarget(t => ({ ...t, name: e.target.value }))} />
                                <div className="grid grid-cols-2 gap-2">
                                    <div><Label className="text-[10px] text-white/30 mb-1 block">RA (°)</Label>
                                        <Input type="number" step="0.01" placeholder="83.82" className="h-8 text-xs bg-white/5 border-white/10"
                                            value={localTarget.ra} onChange={e => setLocalTarget(t => ({ ...t, ra: +e.target.value }))} /></div>
                                    <div><Label className="text-[10px] text-white/30 mb-1 block">Dec (°)</Label>
                                        <Input type="number" step="0.01" placeholder="-5.39" className="h-8 text-xs bg-white/5 border-white/10"
                                            value={localTarget.dec} onChange={e => setLocalTarget(t => ({ ...t, dec: +e.target.value }))} /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---- TAB: API KEYS ---- */}
                    {activeTab === "api" && (
                        <div className="space-y-4">
                            <div className="text-[11px] text-amber-400/60 bg-amber-400/5 border border-amber-400/15 rounded-lg px-3 py-2">
                                API keys được lưu cục bộ trên máy bạn, không gửi lên server.
                            </div>
                            {[
                                { key: "meteoblue", label: "Meteoblue API Key", placeholder: "meteoblue_..." },
                                { key: "oneSignalAppId", label: "OneSignal App ID", placeholder: "xxxxxxxx-xxxx-..." },
                                { key: "oneSignalRestKey", label: "OneSignal REST API Key", placeholder: "os_..." },
                                { key: "resendApiKey", label: "Resend API Key", placeholder: "re_..." },
                                { key: "alertEmail", label: "Email nhận thông báo", placeholder: "you@email.com" },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-white/60 text-xs">{label}</Label>
                                    <Input
                                        type={key.includes("Key") || key === "resendApiKey" ? "password" : "text"}
                                        placeholder={placeholder}
                                        className="h-8 text-xs bg-white/5 border-white/10"
                                        value={(local.apiKeys as Record<string, string>)[key] || ""}
                                        onChange={e => setLocal(s => ({ ...s, apiKeys: { ...s.apiKeys, [key]: e.target.value } }))}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ---- TAB: OTHER ---- */}
                    {activeTab === "other" && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-white/70 text-xs">Ngưỡng báo động (Score &gt;)</Label>
                                    <span className="text-violet-300 font-bold text-xs">{local.alertThreshold}</span>
                                </div>
                                <Slider value={[local.alertThreshold]} min={50} max={100} step={1}
                                    onValueChange={([v]) => setLocal(s => ({ ...s, alertThreshold: v }))} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-white/70 text-xs">Ghi đè AOD thủ công (0 = tự động)</Label>
                                    <span className="text-violet-300 font-bold text-xs">{local.aodOverride ?? "Auto"}</span>
                                </div>
                                <Input type="number" step="0.01" min={0} max={2}
                                    placeholder="Ví dụ: 0.15 (để trống = auto)"
                                    className="h-8 text-xs bg-white/5 border-white/10"
                                    value={local.aodOverride ?? ""}
                                    onChange={e => setLocal(s => ({ ...s, aodOverride: e.target.value ? +e.target.value : null }))} />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-white/10">
                                {[
                                    { key: "liveSimulation", label: "Chế độ Mô phỏng trực tiếp", desc: "Chọn ngày giờ tuỳ ý để thử nghiệm" },
                                    { key: "showTooltips", label: "Hiện tooltip khoa học", desc: "Giải thích các công thức vật lý" },
                                ].map(({ key, label, desc }) => (
                                    <div key={key} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-white/70 text-xs font-semibold">{label}</p>
                                            <p className="text-white/30 text-[10px]">{desc}</p>
                                        </div>
                                        <Switch
                                            checked={(local as unknown as Record<string, boolean>)[key]}
                                            onCheckedChange={v => setLocal(s => ({ ...s, [key]: v }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                    <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/60 text-xs"
                        onClick={() => setIsOpen(false)}>Huỷ</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}
                        className="gap-2 text-xs bg-violet-600 hover:bg-violet-500">
                        {saving ? <CheckCircle2 className="h-3.5 w-3.5 animate-pulse" /> : <Save className="h-3.5 w-3.5" />}
                        {saving ? "Đang lưu..." : "Lưu cài đặt"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
