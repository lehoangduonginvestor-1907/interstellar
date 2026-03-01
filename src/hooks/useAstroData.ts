"use client";

import { useQuery } from "@tanstack/react-query";
import { LocationInfo } from "@/store/useAppStore";

/**
 * Mapped Open-Meteo response structure
 */
export interface MeteoHourlyData {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    cloud_cover: number[];
    cloud_cover_low: number[];
    cloud_cover_mid: number[];
    cloud_cover_high: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_speed_500hPa: number[]; // Jet Stream proxy (~5500m altitude)
}

export interface MeteoResponse {
    hourly: MeteoHourlyData;
    timezone: string;
}

/**
 * Open-Meteo Air Quality response — provides real AQI and AOD per hour
 */
export interface AirQualityHourlyData {
    time: string[];
    us_aqi: number[];                // US AQI 0–500
    aerosol_optical_depth: number[]; // AOD 550 nm (replaces hardcoded 0.1)
    dust: number[];                  // Dust µg/m³ (bonus warning layer)
}

export interface AirQualityResponse {
    hourly: AirQualityHourlyData;
    timezone: string;
}

/**
 * 7Timer Astro Response (Mocked/Mapped)
 */
export interface SevenTimerAstroItem {
    timepoint: number;
    cloudcover: number;
    seeing: number; // 1 (excellent) to 8 (very poor)
    transparency: number; // 1 (excellent) to 8 (very poor)
    lifted_index: number;
    rh2m: number;
}
export interface SevenTimerResponse {
    dataseries: SevenTimerAstroItem[];
    init: string;
}

// Ensure the endpoint gets ensemble data if needed, but for now we pull robust single deterministic models
const getMeteoForecast = async (lat: number, lon: number): Promise<MeteoResponse> => {
    // wind_speed_500hPa = Jet Stream proxy at ~5500m — needed for scintillation risk model
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_speed_500hPa&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Open-Meteo data");
    return res.json();
};

/**
 * Open-Meteo Air Quality API — free, no API key required.
 * Provides real-time AQI and Aerosol Optical Depth per hour,
 * replacing the previous hardcoded AQI=50 and AOD=0.1.
 */
const getAirQuality = async (lat: number, lon: number): Promise<AirQualityResponse> => {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi,aerosol_optical_depth,dust&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Air Quality data");
    return res.json();
};

const getSevenTimerAstro = async (lat: number, lon: number): Promise<SevenTimerResponse> => {
    const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json&tzshift=0`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch 7Timer data");
    return res.json();
};

// We create a combined hook to fetch everything representing our complete atmospheric dataset
export function useAstroData(location?: LocationInfo) {

    const meteoQuery = useQuery({
        queryKey: ["meteo", location?.id],
        queryFn: () => getMeteoForecast(location!.lat, location!.lon),
        enabled: !!location,
    });

    const airQualityQuery = useQuery({
        queryKey: ["airquality", location?.id],
        queryFn: () => getAirQuality(location!.lat, location!.lon),
        enabled: !!location,
        // Air quality changes slowly — cache for 30 min
        staleTime: 30 * 60 * 1000,
    });

    const sevenTimerQuery = useQuery({
        queryKey: ["7timer", location?.id],
        queryFn: () => getSevenTimerAstro(location!.lat, location!.lon),
        enabled: !!location,
    });

    return {
        meteo: meteoQuery,
        airQuality: airQualityQuery,
        sevenTimer: sevenTimerQuery,
        isLoading: meteoQuery.isLoading || sevenTimerQuery.isLoading || airQualityQuery.isLoading,
        isError: meteoQuery.isError || sevenTimerQuery.isError,
    };
}
