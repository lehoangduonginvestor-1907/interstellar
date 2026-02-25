"use client";

import { useEffect } from "react";

export function OneSignalInit() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

        // Only initialize if we have a valid UUID-style App ID
        const isValidUUID = appId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId);

        if (!isValidUUID) {
            // No valid App ID — skip silently in development
            if (process.env.NODE_ENV === "development") {
                console.info("[Interstellar] OneSignal skipped: no valid NEXT_PUBLIC_ONESIGNAL_APP_ID configured.");
            }
            return;
        }

        import("react-onesignal")
            .then(({ default: OneSignal }) => {
                OneSignal.init({
                    appId: appId!,
                    allowLocalhostAsSecureOrigin: true,
                }).catch((err: Error) => {
                    console.warn("[Interstellar] OneSignal init failed:", err.message);
                });
            })
            .catch(() => {
                // Module-level failure — silently swallow
            });
    }, []);

    return null;
}

/**
 * Send a push notification via OneSignal REST API.
 * Call from a Server Action or API route (not client).
 */
export async function sendPushNotification(title: string, message: string, url?: string) {
    const restKey = process.env.ONESIGNAL_REST_KEY;
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!restKey || !appId) return { ok: false, reason: "Missing env vars" };

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${restKey}`,
        },
        body: JSON.stringify({
            app_id: appId,
            included_segments: ["All"],
            headings: { en: title, vi: title },
            contents: { en: message, vi: message },
            url: url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        }),
    });

    return { ok: res.ok };
}
