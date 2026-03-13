import logoPng from "@/assets/logo.png";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  UploadCloud,
  Database,
  BarChart2,
  LineChart,
  BrainCircuit,
  FileText,
  Info,
  Menu,
  X,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Droplets,
  Wind,
  MapPin,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const BASE = "/weatherscope-capstone";

interface SidebarWeather {
  location: string;
  temp_c: number;
  condition: string;
  humidity: number;
  wind_kph: number;
}

function getWeatherIcon(condition: string) {
  const cond = condition.toLowerCase();
  const iconClass = "h-8 w-8";

  if (cond.includes("snow") || cond.includes("sleet")) {
    return <CloudSnow className={`${iconClass} text-blue-200`} />;
  }
  if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
    return <CloudRain className={`${iconClass} text-blue-400`} />;
  }
  if (cond.includes("cloud") || cond.includes("overcast")) {
    return <Cloud className={`${iconClass} text-gray-300`} />;
  }
  return <Sun className={`${iconClass} text-yellow-400`} />;
}

const items = [
  { href: BASE + "/", label: "Overview", icon: LayoutDashboard },
  { href: BASE + "/upload", label: "Data Upload", icon: UploadCloud },
  { href: BASE + "/cleaning", label: "Data Cleaning", icon: Database },
  { href: BASE + "/analysis", label: "Statistical Analysis", icon: BarChart2 },
  { href: BASE + "/visualization", label: "Visualization", icon: LineChart },
  { href: BASE + "/prediction", label: "AI Prediction", icon: BrainCircuit },
  { href: BASE + "/results", label: "Results & Insights", icon: FileText },
  { href: BASE + "/about", label: "About Project", icon: Info },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [weather, setWeather] = useState<SidebarWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setIsOpen(false);
    else setIsOpen(true);
  }, [isMobile, location]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(BASE + "/api/weather/Delhi");
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.error("Weather fetch failed:", error);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-md shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 shadow-2xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-1">
              <img src={logoPng} className="h-8 w-8 rounded-lg" />
              <h1 className="text-xl font-bold text-blue-400">
                Weather<span className="text-white">Scope</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Weather Analytics
            </p>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {items.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer",
                        isActive
                          ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}>
                        <item.icon size={18} />
                        {item.label}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <p className="text-xs text-slate-400">Data Analyst</p>
          </div>

        </div>
      </div>
    </>
  );
}
