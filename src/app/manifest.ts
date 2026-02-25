import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Interstellar — Astrophoto Weather",
        short_name: "Interstellar",
        description: "Công cụ dự báo thời tiết thiên văn chuyên nghiệp cho nhà chụp ảnh thiên văn Việt Nam",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0514",
        theme_color: "#8b5cf6",
        orientation: "portrait-primary",
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}
