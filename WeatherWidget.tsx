import React, { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, Wind, MapPin, Loader2, Thermometer, Droplets, AlertTriangle, Search } from "lucide-react";

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

// WMO Weather interpretation codes
const getWeatherDescription = (code: number) => {
  if (code === 0) return { desc: "Clear sky", icon: <Sun className="w-6 h-6 text-amber-500" /> };
  if (code === 1 || code === 2 || code === 3) return { desc: "Partly cloudy", icon: <Cloud className="w-6 h-6 text-slate-400" /> };
  if (code >= 45 && code <= 48) return { desc: "Foggy", icon: <Cloud className="w-6 h-6 text-slate-300" /> };
  if (code >= 51 && code <= 67) return { desc: "Rain / Drizzle", icon: <CloudRain className="w-6 h-6 text-blue-500" /> };
  if (code >= 71 && code <= 77) return { desc: "Snow", icon: <CloudRain className="w-6 h-6 text-sky-300" /> };
  if (code >= 80 && code <= 82) return { desc: "Rain showers", icon: <CloudRain className="w-6 h-6 text-blue-600" /> };
  if (code >= 95 && code <= 99) return { desc: "Thunderstorm", icon: <CloudRain className="w-6 h-6 text-indigo-600" /> };
  return { desc: "Unknown", icon: <Cloud className="w-6 h-6 text-slate-400" /> };
};

export default function WeatherWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
          setLocationName("Your Farm Location");
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback location (e.g., Kampala, Uganda or generic)
          setLat(0.3476);
          setLon(32.5825);
          setLocationName("Kampala (Fallback)");
        }
      );
    } else {
      setLat(0.3476);
      setLon(32.5825);
      setLocationName("Kampala (Fallback)");
    }
  }, []);

  useEffect(() => {
    if (lat === null || lon === null) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
        );
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load weather forecast. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lon]);

  // Farm advice based on weather
  const getFarmAdvice = (current: WeatherData["current"]) => {
    if (current.precipitation > 0 || current.weather_code >= 51) {
      return "Rain expected. Delay spraying chemicals or fertilizers. Good time for indoor sorting.";
    }
    if (current.wind_speed_10m > 15) {
      return "High winds. Avoid spraying. Ensure greenhouse structures are secure.";
    }
    if (current.temperature_2m > 30 && current.relative_humidity_2m < 40) {
      return "High heat and low humidity. Prioritize irrigation in the early morning or evening.";
    }
    return "Optimal weather. Good conditions for planting, spraying, and general field work.";
  };

  if (loading && !weather) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex flex-col items-center justify-center min-h-[250px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Fetching climate data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Weather Unavailable</h3>
        </div>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  if (!weather) return null;

  const currentStatus = getWeatherDescription(weather.current.weather_code);
  const advice = getFarmAdvice(weather.current);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cloud className="w-4 h-4 text-sky-500" />
          <span>Local Farm Forecast</span>
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{locationName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-2xl">
            {currentStatus.icon}
          </div>
          <div>
            <div className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-start">
              {Math.round(weather.current.temperature_2m)}
              <span className="text-lg text-slate-400 mt-1 ml-0.5">°C</span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {currentStatus.desc}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Humidity</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{weather.current.relative_humidity_2m}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl">
          <Wind className="w-4 h-4 text-teal-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Wind</p>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{weather.current.wind_speed_10m} km/h</p>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
        <h4 className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5" />
          Agro-Action Advice
        </h4>
        <p className="text-xs text-emerald-600/90 dark:text-emerald-300/80 leading-relaxed">
          {advice}
        </p>
      </div>

      {/* 3-Day Forecast */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">3-Day Outlook</p>
        <div className="grid grid-cols-3 gap-2">
          {weather.daily.time.slice(1, 4).map((time, idx) => {
            // idx + 1 corresponds to tomorrow, day after, etc.
            const date = new Date(time);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dailyCode = weather.daily.weather_code[idx + 1];
            const maxTemp = Math.round(weather.daily.temperature_2m_max[idx + 1]);
            const minTemp = Math.round(weather.daily.temperature_2m_min[idx + 1]);
            const precipProb = weather.daily.precipitation_probability_max[idx + 1];
            
            const { icon } = getWeatherDescription(dailyCode);

            return (
              <div key={time} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">{dayName}</span>
                <div className="scale-75 -my-1">{icon}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{maxTemp}°</span>
                  <span className="text-[10px] font-medium text-slate-400">{minTemp}°</span>
                </div>
                {precipProb > 20 && (
                  <div className="flex items-center gap-0.5 mt-1 text-[9px] text-blue-500 font-medium">
                    <Droplets className="w-2.5 h-2.5" /> {precipProb}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
