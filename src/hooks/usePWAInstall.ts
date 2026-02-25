"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
    const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", handler);

        // Already installed?
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const install = async () => {
        if (!prompt) return false;
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
            setPrompt(null);
        }
        return outcome === "accepted";
    };

    return { canInstall: !!prompt && !isInstalled, install, isInstalled };
}
