import { db } from "./db";
import { 
  weatherData, 
  appUsers, 
  usageLogs,
  type WeatherRecord, 
  type InsertWeatherRecord,
  type AppUser,
  type InsertAppUser,
  type UsageLog,
  type InsertUsageLog
} from "@shared/schema";
import { eq, asc, desc, sql, gte } from "drizzle-orm";

export interface IStorage {
  insertWeatherBulk(records: InsertWeatherRecord[]): Promise<number>;
  getAllWeather(): Promise<WeatherRecord[]>;
  clearWeather(): Promise<void>;
  
  createUser(user: InsertAppUser): Promise<AppUser>;
  getUserByEmail(email: string): Promise<AppUser | undefined>;
  getAllUsers(): Promise<AppUser[]>;
  updateUserStatus(id: number, status: string): Promise<AppUser | undefined>;
  deleteUser(id: number): Promise<void>;
  getUserCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getDisabledUserCount(): Promise<number>;
  
  createUsageLog(log: InsertUsageLog): Promise<void>;
  getAllUsageLogs(): Promise<UsageLog[]>;
  getTotalVisits(): Promise<number>;
  getTodayVisits(): Promise<number>;
  getUsageByDate(): Promise<{ date: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async insertWeatherBulk(records: InsertWeatherRecord[]): Promise<number> {
    if (records.length === 0) return 0;
    await db.insert(weatherData).values(records);
    return records.length;
  }

  async getAllWeather(): Promise<WeatherRecord[]> {
    return await db.select().from(weatherData).orderBy(asc(weatherData.date));
  }

  async clearWeather(): Promise<void> {
    await db.delete(weatherData);
  }

  async createUser(user: InsertAppUser): Promise<AppUser> {
    const [created] = await db.insert(appUsers).values({
      ...user,
      firstAccessAt: new Date()
    }).returning();
    return created;
  }

  async getUserByEmail(email: string): Promise<AppUser | undefined> {
    const [user] = await db.select().from(appUsers).where(eq(appUsers.email, email));
    return user;
  }

  async getAllUsers(): Promise<AppUser[]> {
    return await db.select().from(appUsers).orderBy(desc(appUsers.registeredAt));
  }

  async updateUserStatus(id: number, status: string): Promise<AppUser | undefined> {
    const [updated] = await db.update(appUsers)
      .set({ status })
      .where(eq(appUsers.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(usageLogs).where(eq(usageLogs.userId, id));
    await db.delete(appUsers).where(eq(appUsers.id, id));
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(appUsers);
    return Number(result[0]?.count || 0);
  }

  async getActiveUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(appUsers).where(eq(appUsers.status, 'active'));
    return Number(result[0]?.count || 0);
  }

  async getDisabledUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(appUsers).where(eq(appUsers.status, 'disabled'));
    return Number(result[0]?.count || 0);
  }

  async createUsageLog(log: InsertUsageLog): Promise<void> {
    await db.insert(usageLogs).values(log);
  }

  async getAllUsageLogs(): Promise<UsageLog[]> {
    return await db.select().from(usageLogs).orderBy(desc(usageLogs.accessTime));
  }

  async getTotalVisits(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(usageLogs);
    return Number(result[0]?.count || 0);
  }

  async getTodayVisits(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(usageLogs)
      .where(gte(usageLogs.accessTime, today));
    return Number(result[0]?.count || 0);
  }

  async getUsageByDate(): Promise<{ date: string; count: number }[]> {
    const result = await db.execute(sql`
      SELECT DATE(access_time) as date, COUNT(*)::int as count 
      FROM usage_logs 
      GROUP BY DATE(access_time) 
      ORDER BY date DESC 
      LIMIT 30
    `);
    return (result.rows as any[]).map(r => ({
      date: r.date,
      count: Number(r.count)
    }));
  }
}

export const storage = new DatabaseStorage();
