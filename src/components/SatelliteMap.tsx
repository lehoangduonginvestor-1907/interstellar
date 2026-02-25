"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "@/store/useAppStore";
import L from "leaflet";

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

// Component to dynamically update map center when location changes
function MapUpdater({ lat, lon }: { lat: number, lon: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lon], 6); // Zommed out enough to see clouds regionally
    }, [lat, lon, map]);
    return null;
}

export function SatelliteMap() {
    const [mounted, setMounted] = useState(false);
    const activeLocation = useAppStore(state => state.getActiveLocation());

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !activeLocation) return (
        <div className="w-full h-[400px] flex items-center justify-center bg-card/10 rounded-2xl border border-white/10 animate-pulse">
            <span className="text-muted-foreground text-sm font-medium">Loading Satellite Map...</span>
        </div>
    );

    return (
        <div className="bg-card/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 w-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold tracking-tight">Infrared Satellite (Himawari-9 Equivalent)</h3>
                <p className="text-xs text-muted-foreground">Realtime regional cloud cover map overlapping active location.</p>
            </div>

            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-white/10 relative z-10">
                <MapContainer
                    center={[activeLocation.lat, activeLocation.lon]}
                    zoom={6}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%', backgroundColor: '#0a0114' }}
                >
                    {/* Base Dark Map Tile */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {/* Weather / Cloud overlay (Using OpenWeatherMap standard free cloud layer for demo purposes as Himawari raw feeds require complex WebGL setups) */}
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
        </div>
    );
}
