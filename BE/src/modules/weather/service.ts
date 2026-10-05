import { z } from "zod";

const weatherData = z.object({
  current: z.object({
    temperature_2m: z.number().finite(),
    relative_humidity_2m: z.number().min(0).max(100),
    weather_code: z.number().int(),
    is_day: z.number().int(),
    time: z.string(),
  }),
});
const airData = z.object({
  current: z.object({
    us_aqi: z.number().finite().nonnegative(),
    uv_index: z.number().finite().nonnegative(),
    time: z.string(),
  }),
});

async function fetchConditions(fetcher: typeof fetch, latitude: number, longitude: number) {
  const coords = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "UTC",
  });
  const [weather, air] = await Promise.all([
    fetcher(
      `https://api.open-meteo.com/v1/forecast?${coords}&current=temperature_2m,relative_humidity_2m,weather_code,is_day`,
      { signal: AbortSignal.timeout(10000) },
    ),
    fetcher(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${coords}&current=us_aqi,uv_index`,
      { signal: AbortSignal.timeout(10000) },
    ),
  ]);
  if (!weather.ok || !air.ok) throw new Error("Weather upstream failed");
  const w = weatherData.parse(await weather.json()).current;
  const a = airData.parse(await air.json()).current;
  return {
    temperatureC: w.temperature_2m,
    humidityPercent: w.relative_humidity_2m,
    uvIndex: a.uv_index,
    aqi: a.us_aqi,
    condition:
      w.weather_code === 0
        ? w.is_day
          ? "sunny"
          : "clear"
        : [1, 2, 3, 45, 48].includes(w.weather_code)
          ? "cloudy"
          : "rainy",
    weatherCode: w.weather_code,
    updatedAt: w.time + "Z",
    airQualityUpdatedAt: a.time + "Z",
    source: "Open-Meteo",
    aqiStandard: "US AQI",
    attribution: "Weather: Open-Meteo; air quality: CAMS ENSEMBLE / Open-Meteo",
    attributionUrl: "https://open-meteo.com/en/docs/air-quality-api",
  };
}

// Shared weather only: never store names, health profiles or authentication in this cache.
export function createWeatherService(
  fetcher: typeof fetch = fetch,
  options: {
    ttlMs?: number;
    maxEntries?: number;
    now?: () => number;
  } = {},
) {
  const { ttlMs = 5 * 60000, maxEntries = 100, now = Date.now } = options;
  if (ttlMs <= 0 || !Number.isInteger(maxEntries) || maxEntries < 1)
    throw new Error("Invalid weather cache options");
  type Conditions = Awaited<ReturnType<typeof fetchConditions>>;
  type Entry = { promise: Promise<Conditions>; expiresAt: number };
  const entries = new Map<string, Entry>();
  return async (latitude: number, longitude: number) => {
    const key = `${latitude},${longitude}`;
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now()) {
      entries.delete(key);
      entries.set(key, cached);
      return cached.promise;
    }
    entries.delete(key);
    while (entries.size >= maxEntries) entries.delete(entries.keys().next().value!);
    const entry: Entry = {
      expiresAt: Infinity,
      promise: fetchConditions(fetcher, latitude, longitude),
    };
    entries.set(key, entry);
    try {
      const result = await entry.promise;
      entry.expiresAt = now() + ttlMs;
      return result;
    } catch (error) {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    }
  };
}
