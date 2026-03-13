import { pgTable, text, serial, real, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  temperature: real("temperature").notNull(),
  rainfall: real("rainfall").notNull(),
  humidity: real("humidity").notNull(),
});

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  firstAccessAt: timestamp("first_access_at"),
  status: text("status").default("active").notNull(),
});

export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => appUsers.id),
  accessTime: timestamp("access_time").defaultNow().notNull(),
  actionType: text("action_type").notNull(),
  ipAddress: text("ip_address"),
});

// === BASE SCHEMAS ===
export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({ id: true });
export const insertAppUserSchema = createInsertSchema(appUsers).omit({ id: true, registeredAt: true, firstAccessAt: true });
export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({ id: true, accessTime: true });

// === EXPLICIT API CONTRACT TYPES ===
export type WeatherRecord = typeof weatherData.$inferSelect;
export type InsertWeatherRecord = z.infer<typeof insertWeatherDataSchema>;

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = z.infer<typeof insertAppUserSchema>;

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;

export type WeatherUploadResponse = {
  message: string;
  count: number;
};

export type WeatherStatsResponse = {
  totalRecords: number;
  temp: { min: number; max: number; avg: number };
  rainfall: { min: number; max: number; avg: number };
  humidity: { min: number; max: number; avg: number };
  yearWiseTrends: Record<string, { avgTemp: number; totalRain: number }>;
};

export type PredictionRequest = {
  year: number;
  month: number;
};

export type PredictionResponse = {
  temperature: number;
  rainfall: number;
  humidity: number;
  explanation: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalVisits: number;
  activeUsers: number;
  disabledUsers: number;
  todayVisits: number;
  usageByDate: { date: string; count: number }[];
};

export type AdminLoginRequest = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  success: boolean;
  message: string;
};
