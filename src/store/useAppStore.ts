import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocationInfo {
    id: string;
    name: string;
    nameVi: string;
    lat: number;
    lon: number;
    baseBortleSqm: number;
    elevation?: number; // metres
    isCustom?: boolean;
}

export interface DSOTarget {
    name: string;
    ra: number; // degrees
    dec: number; // degrees
}

export interface Settings {
    weights: {
        cloud: number;
        transparency: number;
        sqm: number;
        seeing: number;
        dewPoint: number;
    };
    apiKeys: {
        meteoblue?: string;
        oneSignalAppId?: string;
        oneSignalRestKey?: string;
        resendApiKey?: string;
        alertEmail?: string;
    };
    alertThreshold: number;
    aodOverride: number | null;
    language: "vi" | "en";
    liveSimulation: boolean;
    showTooltips: boolean;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    score: number;
    location: string;
    timestamp: number;
    read: boolean;
}

interface AppState {
    locations: LocationInfo[];
    activeLocationId: string;
    addLocation: (loc: LocationInfo) => void;
    removeLocation: (id: string) => void;
    setActiveLocation: (id: string) => void;
    getActiveLocation: () => LocationInfo | undefined;

    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;

    activeTarget: DSOTarget;
    setActiveTarget: (target: DSOTarget) => void;

    notifications: Notification[];
    addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
    markAllRead: () => void;
    clearNotifications: () => void;
}

export const DSO_PRESETS: DSOTarget[] = [
    { name: "M42 — Tinh vân Orion", ra: 83.82, dec: -5.39 },
    { name: "M31 — Thiên hà Andromeda", ra: 10.68, dec: 41.27 },
    { name: "M45 — Cụm sao Pleiades", ra: 56.75, dec: 24.12 },
    { name: "M13 — Cụm cầu Hercules", ra: 250.42, dec: 36.46 },
    { name: "M8 — Tinh vân Lagoon", ra: 271.10, dec: -24.38 },
    { name: "NGC 7000 — North America", ra: 314.75, dec: 44.53 },
    { name: "M33 — Thiên hà Triangulum", ra: 23.46, dec: 30.66 },
    { name: "Milky Way Core (Sgr A*)", ra: 266.42, dec: -29.0 },
];

export const DEFAULT_LOCATIONS: LocationInfo[] = [
    {
        id: "binh-minh",
        name: "Bình Minh, Hà Nội",
        nameVi: "Bình Minh, Thanh Oai",
        lat: 20.866, lon: 105.783,
        baseBortleSqm: 19.5,
        elevation: 15,
    },
    {
        id: "cao-dai",
        name: "Cao Đại, Vĩnh Phúc",
        nameVi: "Cao Đại, Vĩnh Tường",
        lat: 21.216, lon: 105.483,
        baseBortleSqm: 20.2,
        elevation: 12,
    },
    {
        id: "dong-van",
        name: "Đồng Văn, Hà Giang",
        nameVi: "Đồng Văn, Hà Giang",
        lat: 23.272, lon: 105.363,
        baseBortleSqm: 21.6,
        elevation: 1000,
    },
    {
        id: "sapa",
        name: "Sa Pa, Lào Cai",
        nameVi: "Sa Pa, Lào Cai",
        lat: 22.336, lon: 103.844,
        baseBortleSqm: 21.2,
        elevation: 1600,
    },
    {
        id: "da-lat",
        name: "Đà Lạt, Lâm Đồng",
        nameVi: "Đà Lạt, Lâm Đồng",
        lat: 11.942, lon: 108.458,
        baseBortleSqm: 20.8,
        elevation: 1500,
    },
    {
        id: "ha-long",
        name: "Hạ Long, Quảng Ninh",
        nameVi: "Hạ Long, Quảng Ninh",
        lat: 20.959, lon: 107.044,
        baseBortleSqm: 19.0,
        elevation: 5,
    },
    {
        id: "mui-ne",
        name: "Mũi Né, Bình Thuận",
        nameVi: "Mũi Né, Bình Thuận",
        lat: 10.933, lon: 108.287,
        baseBortleSqm: 20.4,
        elevation: 5,
    },
    {
        id: "pu-luong",
        name: "Pù Luông, Thanh Hóa",
        nameVi: "Pù Luông, Thanh Hóa",
        lat: 20.428, lon: 104.986,
        baseBortleSqm: 21.0,
        elevation: 1000,
    },
];

const DEFAULT_SETTINGS: Settings = {
    weights: {
        cloud: 35,
        transparency: 20,
        sqm: 20,
        seeing: 15,
        dewPoint: 10,
    },
    apiKeys: {},
    alertThreshold: 80,
    aodOverride: null,
    language: "vi",
    liveSimulation: false,
    showTooltips: true,
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            locations: DEFAULT_LOCATIONS,
            activeLocationId: "binh-minh",

            addLocation: (loc) =>
                set((state) => ({ locations: [...state.locations, loc] })),
            removeLocation: (id) =>
                set((state) => ({
                    locations: state.locations.filter((l) => l.id !== id),
                    activeLocationId:
                        state.activeLocationId === id
                            ? state.locations.find((l) => l.id !== id)?.id || "binh-minh"
                            : state.activeLocationId,
                })),
            setActiveLocation: (id) => set({ activeLocationId: id }),
            getActiveLocation: () => {
                const s = get();
                return s.locations.find((l) => l.id === s.activeLocationId) || s.locations[0];
            },

            settings: DEFAULT_SETTINGS,
            updateSettings: (newSettings) =>
                set((state) => ({ settings: { ...state.settings, ...newSettings } })),

            activeTarget: DSO_PRESETS[0],
            setActiveTarget: (target) => set({ activeTarget: target }),

            notifications: [],
            addNotification: (n) =>
                set((state) => ({
                    notifications: [
                        {
                            ...n,
                            id: `notif-${Date.now()}`,
                            timestamp: Date.now(),
                            read: false,
                        },
                        ...state.notifications.slice(0, 19), // keep max 20
                    ],
                })),
            markAllRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                })),
            clearNotifications: () => set({ notifications: [] }),
        }),
        { name: "interstellar-v2" } // new key to avoid stale data from v1
    )
);
