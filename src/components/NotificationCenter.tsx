"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Trash2, CheckCheck, Telescope } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

export function NotificationCenter() {
    const { notifications, markAllRead, clearNotifications } = useAppStore();
    const [open, setOpen] = useState(false);

    const unread = notifications.filter((n) => !n.read).length;

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("#notif-panel") && !target.closest("#notif-trigger")) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#34d399";
        if (score >= 60) return "#fbbf24";
        return "#f87171";
    };

    return (
        <div className="relative">
            <button
                id="notif-trigger"
                onClick={() => { setOpen(!open); if (open) markAllRead(); }}
                className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-colors"
            >
                {unread > 0 ? (
                    <BellRing className="h-4 w-4 text-violet-400" />
                ) : (
                    <Bell className="h-4 w-4 text-white/40" />
                )}
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-violet-500 text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div
                    id="notif-panel"
                    className="absolute top-12 right-0 z-50 w-[340px] rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: "#0c0a1a", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Telescope className="h-4 w-4 text-violet-400" />
                            <span className="text-sm font-bold text-white">Thông báo</span>
                            {unread > 0 && (
                                <span className="text-[10px] bg-violet-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                    {unread} mới
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllRead} title="Đánh dấu đã đọc">
                                        <CheckCheck className="h-3 w-3 text-white/40" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearNotifications} title="Xoá tất cả">
                                        <Trash2 className="h-3 w-3 text-white/40" />
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                                <X className="h-3 w-3 text-white/40" />
                            </Button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Bell className="h-8 w-8 text-white/10" />
                                <p className="text-white/25 text-xs text-center">Chưa có thông báo nào.<br />Tự động gửi khi điểm quan sát vượt ngưỡng.</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className="flex gap-3 px-4 py-3"
                                    style={{ background: n.read ? "transparent" : "rgba(139,92,246,0.05)" }}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5"
                                        style={{ background: `${getScoreColor(n.score)}20`, color: getScoreColor(n.score) }}
                                    >
                                        {n.score}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white/80 leading-snug">{n.title}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed truncate">{n.message}</p>
                                        <p className="text-[10px] text-white/25 mt-1">{n.location} · {formatDate(n.timestamp)} {formatTime(n.timestamp)}</p>
                                    </div>
                                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer: PWA push opt-in hint */}
                    <div className="px-4 py-3 border-t border-white/10" style={{ background: "rgba(139,92,246,0.05)" }}>
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            Thông báo tự động khi điểm quan sát &gt; {useAppStore.getState().settings.alertThreshold} trong 4 giờ tới.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
