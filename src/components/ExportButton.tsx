"use client";

import React, { useState } from "react";
import { FileImage, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportButton({ targetId = "dashboard-main" }: { targetId?: string }) {
    const [loading, setLoading] = useState<"png" | "pdf" | null>(null);

    const exportPNG = async () => {
        setLoading("png");
        try {
            const { default: html2canvas } = await import("html2canvas");
            const el = document.getElementById(targetId);
            if (!el) throw new Error("Element not found");
            const canvas = await html2canvas(el, {
                backgroundColor: "#080614",
                scale: 1.5,
                useCORS: true,
                logging: false,
            });
            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `interstellar-forecast-${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            toast.success("Đã xuất ảnh PNG!");
        } catch (err) {
            toast.error("Xuất ảnh thất bại. Thử lại sau.");
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    const exportPDF = async () => {
        setLoading("pdf");
        try {
            const { default: html2canvas } = await import("html2canvas");
            const { jsPDF } = await import("jspdf");
            const el = document.getElementById(targetId);
            if (!el) throw new Error("Element not found");
            const canvas = await html2canvas(el, {
                backgroundColor: "#080614",
                scale: 1.5,
                useCORS: true,
                logging: false,
            });
            const imgData = canvas.toDataURL("image/jpeg", 0.9);
            const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
            pdf.save(`interstellar-forecast-${new Date().toISOString().slice(0, 10)}.pdf`);
            toast.success("Đã xuất PDF!");
        } catch (err) {
            toast.error("Xuất PDF thất bại. Thử lại sau.");
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={exportPNG}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-semibold text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-40"
            >
                {loading === "png" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileImage className="h-3 w-3" />}
                Xuất PNG
            </button>
            <button
                onClick={exportPDF}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-semibold text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-40"
            >
                {loading === "pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Xuất PDF
            </button>
        </div>
    );
}
