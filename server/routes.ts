import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertWeatherDataSchema } from "@shared/schema";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_USERNAME and/or ADMIN_PASSWORD environment variables not set. Admin panel will be inaccessible.");
}

if (!SESSION_SECRET) {
  console.warn("WARNING: SESSION_SECRET environment variable not set. Using fallback for development only.");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(session({
    secret: SESSION_SECRET || 'dev-only-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PRODUCTION,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: IS_PRODUCTION ? 'strict' : 'lax'
    }
  }));

  
  function getWindDirection(degrees: number): string {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  function calculateStats(data: any[]) {
    if (data.length === 0) return null;

    const temps = data.map(d => d.temperature);
    const rains = data.map(d => d.rainfall);
    const hums = data.map(d => d.humidity);

    const getMinMaxAvg = (arr: number[]) => ({
      min: Math.min(...arr),
      max: Math.max(...arr),
      avg: arr.reduce((a, b) => a + b, 0) / arr.length
    });

    const yearWiseTrends: Record<string, { sumTemp: number, sumRain: number, count: number }> = {};
    data.forEach(d => {
      const year = new Date(d.date).getFullYear().toString();
      if (!yearWiseTrends[year]) {
        yearWiseTrends[year] = { sumTemp: 0, sumRain: 0, count: 0 };
      }
      yearWiseTrends[year].sumTemp += d.temperature;
      yearWiseTrends[year].sumRain += d.rainfall;
      yearWiseTrends[year].count += 1;
    });

    const yearTrendsFinal: Record<string, { avgTemp: number; totalRain: number }> = {};
    Object.keys(yearWiseTrends).forEach(year => {
      yearTrendsFinal[year] = {
        avgTemp: yearWiseTrends[year].sumTemp / yearWiseTrends[year].count,
        totalRain: yearWiseTrends[year].sumRain
      };
    });

    return {
      totalRecords: data.length,
      temp: getMinMaxAvg(temps),
      rainfall: getMinMaxAvg(rains),
      humidity: getMinMaxAvg(hums),
      yearWiseTrends: yearTrendsFinal
    };
  }

  function predictValue(data: any[], targetYear: number, targetMonth: number) {
    const n = data.length;
    if (n < 2) return null;

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const startDate = new Date(sorted[0].date);
    const xValues = sorted.map(d => {
      const dt = new Date(d.date);
      return (dt.getFullYear() - startDate.getFullYear()) * 12 + (dt.getMonth() - startDate.getMonth());
    });

    const targetDate = new Date(targetYear, targetMonth - 1, 1);
    const targetX = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + (targetDate.getMonth() - startDate.getMonth());

    const predictFor = (yValues: number[]) => {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumX2 += xValues[i] * xValues[i];
      }

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const c = (sumY - m * sumX) / n;

      return m * targetX + c;
    };

    return {
      temperature: predictFor(sorted.map(d => d.temperature)),
      rainfall: predictFor(sorted.map(d => d.rainfall)),
      humidity: predictFor(sorted.map(d => d.humidity))
    };
  }

  app.get(api.weather.list.path, async (req, res) => {
    const data = await storage.getAllWeather();
    res.json(data);
  });

  // Flexible date parser — accepts multiple formats, returns Date or null (like pandas errors='coerce')
  function parseFlexibleDate(dateStr: unknown): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const trimmed = dateStr.trim();

    // ISO / native JS parse (handles YYYY-MM-DD, MM/DD/YYYY, full ISO strings)
    const native = new Date(trimmed);
    if (!isNaN(native.getTime())) return native;

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // YYYY/MM/DD
    const ymd = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymd) {
      const d = new Date(`${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }

    // DD MMM YYYY (e.g., 15 Jan 2023)
    const dmonthy = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
    if (dmonthy) {
      const d = new Date(`${dmonthy[2]} ${dmonthy[1]}, ${dmonthy[3]}`);
      if (!isNaN(d.getTime())) return d;
    }

    // MMM DD, YYYY (e.g., Jan 15, 2023)
    const monthdY = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (monthdY) {
      const d = new Date(`${monthdY[1]} ${monthdY[2]}, ${monthdY[3]}`);
      if (!isNaN(d.getTime())) return d;
    }

    return null; // coerce to null — row will be skipped
  }

  app.post(api.weather.upload.path, async (req, res) => {
    try {
      const rawBody = Array.isArray(req.body) ? req.body : [];

      // Auto-clean: parse each row, skip invalid ones instead of throwing
      const validRecords: { date: Date; temperature: number; rainfall: number; humidity: number }[] = [];
      let skipped = 0;

      for (const row of rawBody) {
        const date = parseFlexibleDate(row.date);
        const temperature = parseFloat(row.temperature);
        const rainfall = parseFloat(row.rainfall);
        const humidity = parseFloat(row.humidity);

        // Skip rows with invalid date or NaN numbers
        if (!date || isNaN(temperature) || isNaN(rainfall) || isNaN(humidity)) {
          skipped++;
          continue;
        }

        validRecords.push({ date, temperature, rainfall, humidity });
      }

      if (validRecords.length === 0) {
        return res.status(400).json({
          message: skipped > 0
            ? `All ${skipped} rows had invalid data and were skipped. Please check your CSV format.`
            : "No valid records found in uploaded data."
        });
      }

      const count = await storage.insertWeatherBulk(validRecords);
      res.status(201).json({
        message: skipped > 0
          ? `Uploaded ${count} records successfully. ${skipped} invalid rows were skipped automatically.`
          : "Data uploaded successfully",
        count
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error during upload" });
    }
  });

  app.delete(api.weather.clear.path, async (req, res) => {
    await storage.clearWeather();
    res.status(204).send();
  });

  app.get(api.weather.stats.path, async (req, res) => {
    const data = await storage.getAllWeather();
    const stats = calculateStats(data);
    
    if (!stats) {
      return res.json({
        totalRecords: 0,
        temp: { min: 0, max: 0, avg: 0 },
        rainfall: { min: 0, max: 0, avg: 0 },
        humidity: { min: 0, max: 0, avg: 0 },
        yearWiseTrends: {}
      });
    }
    res.json(stats);
  });

  // Current Weather API using Open-Meteo (free, no API key required)
  // IMPORTANT: This :city wildcard route must be registered AFTER all specific /api/weather/* routes
  // to prevent it from intercepting routes like /api/weather/stats or /api/weather/upload
  app.get("/api/weather/:city", async (req: Request, res: Response) => {
    try {
      const city = req.params.city as string;
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      if (!geoResponse.ok) return res.status(geoResponse.status).json({ error: "City not found" });
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) return res.status(404).json({ error: "City not found" });
      const location = geoData.results[0];
      const { latitude, longitude, name, country } = location;
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&timezone=auto`
      );
      if (!weatherResponse.ok) return res.status(weatherResponse.status).json({ error: "Failed to fetch weather" });
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      const weatherDescriptions: Record<number, string> = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
        80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
        85: "Slight snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
        96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail"
      };
      res.json({
        location: name, country,
        temp_c: Math.round(current.temperature_2m),
        temp_f: Math.round(current.temperature_2m * 9/5 + 32),
        condition: weatherDescriptions[current.weather_code] || "Unknown",
        humidity: current.relative_humidity_2m,
        wind_kph: Math.round(current.wind_speed_10m),
        wind_dir: getWindDirection(current.wind_direction_10m),
        feelslike_c: Math.round(current.apparent_temperature),
        cloud: current.cloud_cover,
        weather_code: current.weather_code
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.post(api.weather.predict.path, async (req, res) => {
    const input = api.weather.predict.input.parse(req.body);
    const data = await storage.getAllWeather();
    
    const prediction = predictValue(data, input.year, input.month);

    if (!prediction) {
      return res.json({
        temperature: 0,
        rainfall: 0,
        humidity: 0,
        explanation: "Insufficient data to make a prediction. Please upload historical weather data."
      });
    }

    res.json({
      ...prediction,
      explanation: `Based on linear regression of historical trends, we predict these values for ${input.year}-${input.month}. Note that simple linear regression may not capture seasonal variations accurately.`
    });
  });

  app.post(api.users.register.path, async (req, res) => {
    try {
      const input = api.users.register.input.parse(req.body);
      
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(input);
      
      await storage.createUsageLog({
        userId: user.id,
        actionType: "registration",
        ipAddress: req.ip || null
      });
      
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", field: err.errors[0].path.join('.') });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.users.trackUsage.path, async (req, res) => {
    try {
      const input = api.users.trackUsage.input.parse(req.body);
      await storage.createUsageLog({
        userId: input.userId,
        actionType: input.actionType,
        ipAddress: req.ip || null
      });
      res.status(201).json({ message: "Usage tracked" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.admin.login.path, (req, res) => {
    try {
      if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return res.status(503).json({ success: false, message: "Admin panel not configured" });
      }
      
      const input = api.admin.login.input.parse(req.body);
      
      if (input.username === ADMIN_USERNAME && input.password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.json({ success: true, message: "Login successful" });
      }
      
      res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (err) {
      res.status(400).json({ success: false, message: "Invalid request" });
    }
  });

  app.post(api.admin.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(api.admin.checkSession.path, (req, res) => {
    res.json({ authenticated: !!req.session?.isAdmin });
  });

  app.get(api.admin.dashboard.path, requireAdmin, async (req, res) => {
    try {
      const [totalUsers, totalVisits, activeUsers, disabledUsers, todayVisits, usageByDate] = await Promise.all([
        storage.getUserCount(),
        storage.getTotalVisits(),
        storage.getActiveUserCount(),
        storage.getDisabledUserCount(),
        storage.getTodayVisits(),
        storage.getUsageByDate()
      ]);

      res.json({
        totalUsers,
        totalVisits,
        activeUsers,
        disabledUsers,
        todayVisits,
        usageByDate
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get(api.admin.users.path, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const input = api.admin.updateUser.input.parse(req.body);
      
      const user = await storage.updateUserStatus(id, input.status);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid status value" });
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get(api.admin.usageLogs.path, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllUsageLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch usage logs" });
    }
  });

  app.get(api.admin.exportUsers.path, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      let csv = "ID,Name,Email,Registered At,First Access At,Status\n";
      users.forEach(u => {
        csv += `${u.id},"${u.name}","${u.email}","${u.registeredAt}","${u.firstAccessAt || ''}","${u.status}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);
    } catch (err) {
      res.status(500).json({ message: "Failed to export users" });
    }
  });

  app.get(api.admin.exportLogs.path, requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllUsageLogs();
      
      let csv = "ID,User ID,Access Time,Action Type,IP Address\n";
      logs.forEach(l => {
        csv += `${l.id},${l.userId},"${l.accessTime}","${l.actionType}","${l.ipAddress || ''}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=usage_logs.csv');
      res.send(csv);
    } catch (err) {
      res.status(500).json({ message: "Failed to export logs" });
    }
  });

  app.post(api.admin.changePassword.path, requireAdmin, (req, res) => {
    res.json({ 
      success: true, 
      message: "Password change is not supported in this environment. Please update the ADMIN_PASSWORD environment variable." 
    });
  });

  async function seed() {
    const existing = await storage.getAllWeather();
    if (existing.length === 0) {
      const records = [];
      const startDate = new Date('2020-01-01');
      for (let i = 0; i < 36; i++) {
        const date = new Date(startDate);
        date.setMonth(startDate.getMonth() + i);
        
        const month = date.getMonth();
        const isSummer = month >= 5 && month <= 7;
        const isRainy = month >= 8 && month <= 10;
        
        records.push({
          date: date.toISOString(),
          temperature: 20 + (isSummer ? 10 : 0) + Math.random() * 5,
          rainfall: 50 + (isRainy ? 100 : 0) + Math.random() * 20,
          humidity: 60 + (isRainy ? 20 : 0) + Math.random() * 10
        });
      }
      const formattedRecords = records.map(r => ({
        ...r,
        date: new Date(r.date)
      }));
      await storage.insertWeatherBulk(formattedRecords);
      console.log("Seeded weather data");
    }
  }

  await seed();

  return httpServer;
}
