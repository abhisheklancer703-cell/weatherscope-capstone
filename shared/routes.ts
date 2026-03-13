import { z } from 'zod';
import { insertWeatherDataSchema, weatherData, appUsers, usageLogs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  weather: {
    list: {
      method: 'GET' as const,
      path: '/api/weather',
      responses: {
        200: z.array(z.custom<typeof weatherData.$inferSelect>()),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/weather/upload',
      input: z.array(insertWeatherDataSchema),
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/weather/clear',
      responses: {
        204: z.void(),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/weather/stats',
      responses: {
        200: z.custom<{
          totalRecords: number;
          temp: { min: number; max: number; avg: number };
          rainfall: { min: number; max: number; avg: number };
          humidity: { min: number; max: number; avg: number };
          yearWiseTrends: Record<string, { avgTemp: number; totalRain: number }>;
        }>(),
      },
    },
    predict: {
      method: 'POST' as const,
      path: '/api/weather/predict',
      input: z.object({ year: z.number(), month: z.number() }),
      responses: {
        200: z.object({
          temperature: z.number(),
          rainfall: z.number(),
          humidity: z.number(),
          explanation: z.string(),
        }),
      },
    },
  },
  users: {
    register: {
      method: 'POST' as const,
      path: '/api/users/register',
      input: z.object({ name: z.string(), email: z.string().email() }),
      responses: {
        201: z.custom<typeof appUsers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    trackUsage: {
      method: 'POST' as const,
      path: '/api/users/track',
      input: z.object({ userId: z.number(), actionType: z.string() }),
      responses: {
        201: z.object({ message: z.string() }),
      },
    },
  },
  admin: {
    login: {
      method: 'POST' as const,
      path: '/api/admin/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/admin/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    checkSession: {
      method: 'GET' as const,
      path: '/api/admin/session',
      responses: {
        200: z.object({ authenticated: z.boolean() }),
      },
    },
    dashboard: {
      method: 'GET' as const,
      path: '/api/admin/dashboard',
      responses: {
        200: z.custom<{
          totalUsers: number;
          totalVisits: number;
          activeUsers: number;
          disabledUsers: number;
          todayVisits: number;
          usageByDate: { date: string; count: number }[];
        }>(),
        401: errorSchemas.unauthorized,
      },
    },
    users: {
      method: 'GET' as const,
      path: '/api/admin/users',
      responses: {
        200: z.array(z.custom<typeof appUsers.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    updateUser: {
      method: 'PATCH' as const,
      path: '/api/admin/users/:id',
      input: z.object({ status: z.enum(['active', 'disabled']) }),
      responses: {
        200: z.custom<typeof appUsers.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    deleteUser: {
      method: 'DELETE' as const,
      path: '/api/admin/users/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    usageLogs: {
      method: 'GET' as const,
      path: '/api/admin/usage-logs',
      responses: {
        200: z.array(z.custom<typeof usageLogs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    exportUsers: {
      method: 'GET' as const,
      path: '/api/admin/export/users',
      responses: {
        200: z.string(),
        401: errorSchemas.unauthorized,
      },
    },
    exportLogs: {
      method: 'GET' as const,
      path: '/api/admin/export/logs',
      responses: {
        200: z.string(),
        401: errorSchemas.unauthorized,
      },
    },
    changePassword: {
      method: 'POST' as const,
      path: '/api/admin/change-password',
      input: z.object({ currentPassword: z.string(), newPassword: z.string() }),
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
